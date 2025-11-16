import express from 'express';
import { authenticate, requireCompany, AuthRequest } from '../middleware/auth';
import pool from '../database/connection';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

// Create client
router.post('/', [
  body('name').notEmpty().trim(),
  body('email').optional().isEmail()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, address, taxNumber, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO clients (company_id, name, email, phone, address, tax_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.companyId, name, email || null, phone || null, address || null, taxNumber || null, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all clients
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM clients WHERE company_id = $1 ORDER BY name ASC',
      [req.companyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single client
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM documents WHERE client_id = c.id) as document_count,
        (SELECT SUM(total) FROM documents WHERE client_id = c.id AND status = 'paid') as total_paid
       FROM clients c
       WHERE c.id = $1 AND c.company_id = $2`,
      [req.params.id, req.companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get client documents
    const documentsResult = await pool.query(
      'SELECT * FROM documents WHERE client_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );

    res.json({
      ...result.rows[0],
      recentDocuments: documentsResult.rows
    });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update client
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { name, email, phone, address, taxNumber, notes } = req.body;

    const result = await pool.query(
      `UPDATE clients SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        tax_number = COALESCE($5, tax_number),
        notes = COALESCE($6, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND company_id = $8
      RETURNING *`,
      [name, email, phone, address, taxNumber, notes, req.params.id, req.companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete client
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM clients WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search clients (for autocomplete)
router.get('/search/:query', async (req: AuthRequest, res) => {
  try {
    const query = `%${req.params.query}%`;
    const result = await pool.query(
      `SELECT id, name, email, phone FROM clients 
       WHERE company_id = $1 AND (name ILIKE $2 OR email ILIKE $2)
       LIMIT 10`,
      [req.companyId, query]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Search clients error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

