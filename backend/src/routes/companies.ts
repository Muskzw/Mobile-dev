import express, { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireCompany, AuthRequest } from '../middleware/auth';
import pool from '../database/connection';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only PNG and JPG images are allowed'));
  }
});

// Create company (Business Profile Setup)
router.post('/', authenticate, upload.single('logo'), [
  body('name').notEmpty().trim(),
  body('email').optional().isEmail(),
  body('currency').optional().isLength({ min: 3, max: 3 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      contactName,
      address,
      addressLine2,
      addressLine3,
      phone,
      email,
      taxNumber,
      registrationNumber,
      businessLabel,
      businessNumber,
      businessCategory,
      currency,
      brandColor,
      paymentInstructions
    } = req.body;

    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO companies (
        user_id, name, contact_name, logo_url, address, address_line2, address_line3,
        phone, email, tax_number, registration_number, business_label, business_number,
        business_category, currency, brand_color, payment_instructions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        req.userId,
        name,
        contactName || null,
        logoUrl,
        address || null,
        addressLine2 || null,
        addressLine3 || null,
        phone || null,
        email || null,
        taxNumber || null,
        registrationNumber || null,
        businessLabel || null,
        businessNumber || null,
        businessCategory || null,
        currency || 'USD',
        brandColor || '#3B82F6',
        paymentInstructions || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all companies for user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single company
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM companies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update company
router.put('/:id', authenticate, upload.single('logo'), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      contactName,
      address,
      addressLine2,
      addressLine3,
      phone,
      email,
      taxNumber,
      registrationNumber,
      businessLabel,
      businessNumber,
      businessCategory,
      currency,
      brandColor,
      paymentInstructions
    } = req.body;

    // Check ownership
    const companyCheck = await pool.query(
      'SELECT * FROM companies WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (companyCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const existingCompany = companyCheck.rows[0];
    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : existingCompany.logo_url;

    const result = await pool.query(
      `UPDATE companies SET
        name = COALESCE($1, name),
        contact_name = COALESCE($2, contact_name),
        logo_url = COALESCE($3, logo_url),
        address = COALESCE($4, address),
        address_line2 = COALESCE($5, address_line2),
        address_line3 = COALESCE($6, address_line3),
        phone = COALESCE($7, phone),
        email = COALESCE($8, email),
        tax_number = COALESCE($9, tax_number),
        registration_number = COALESCE($10, registration_number),
        business_label = COALESCE($11, business_label),
        business_number = COALESCE($12, business_number),
        business_category = COALESCE($13, business_category),
        currency = COALESCE($14, currency),
        brand_color = COALESCE($15, brand_color),
        payment_instructions = COALESCE($16, payment_instructions),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17 AND user_id = $18
      RETURNING *`,
      [
        name || null,
        contactName || null,
        logoUrl,
        address || null,
        addressLine2 || null,
        addressLine3 || null,
        phone || null,
        email || null,
        taxNumber || null,
        registrationNumber || null,
        businessLabel || null,
        businessNumber || null,
        businessCategory || null,
        currency || null,
        brandColor || null,
        paymentInstructions || null,
        req.params.id,
        req.userId
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete company
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM companies WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    res.json({ message: 'Company deleted' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

