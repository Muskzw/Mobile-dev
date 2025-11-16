import express from 'express';
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
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      address,
      phone,
      email,
      taxNumber,
      registrationNumber,
      currency,
      brandColor
    } = req.body;

    const logoUrl = req.file ? `/uploads/logos/${req.file.filename}` : null;

    const result = await pool.query(
      `INSERT INTO companies (
        user_id, name, logo_url, address, phone, email, 
        tax_number, registration_number, currency, brand_color
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        req.userId,
        name,
        logoUrl,
        address || null,
        phone || null,
        email || null,
        taxNumber || null,
        registrationNumber || null,
        currency || 'USD',
        brandColor || '#3B82F6'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all companies for user
router.get('/', authenticate, async (req: AuthRequest, res) => {
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
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
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
router.put('/:id', authenticate, upload.single('logo'), async (req: AuthRequest, res) => {
  try {
    const {
      name,
      address,
      phone,
      email,
      taxNumber,
      registrationNumber,
      currency,
      brandColor
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
        logo_url = COALESCE($2, logo_url),
        address = COALESCE($3, address),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        tax_number = COALESCE($6, tax_number),
        registration_number = COALESCE($7, registration_number),
        currency = COALESCE($8, currency),
        brand_color = COALESCE($9, brand_color),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND user_id = $11
      RETURNING *`,
      [
        name || null,
        logoUrl,
        address || null,
        phone || null,
        email || null,
        taxNumber || null,
        registrationNumber || null,
        currency || null,
        brandColor || null,
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
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
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

