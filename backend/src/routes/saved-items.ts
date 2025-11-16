import express from 'express';
import { authenticate, requireCompany, AuthRequest } from '../middleware/auth';
import pool from '../database/connection';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

// Get saved items
router.get('/', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM saved_items WHERE company_id = $1 ORDER BY name ASC',
      [req.companyId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get saved items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create saved item
router.post('/', [
  body('name').notEmpty(),
  body('unitPrice').isNumeric()
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, unitPrice, taxRate, category } = req.body;

    const result = await pool.query(
      `INSERT INTO saved_items (company_id, name, description, unit_price, tax_rate, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.companyId, name, description || null, unitPrice, taxRate || 0, category || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create saved item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete saved item
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM saved_items WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Delete saved item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

