import express, { Response } from 'express';
import { authenticate, requireCompany, AuthRequest } from '../middleware/auth';
import pool from '../database/connection';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

// Get saved items
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM saved_items WHERE user_id = $1 OR company_id = $2 ORDER BY name ASC',
      [req.userId, req.companyId || null]
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
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, unitPrice, taxRate, category } = req.body;

    const result = await pool.query(
      `INSERT INTO saved_items (company_id, name, description, unit_price, tax_rate, category, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.companyId || null, name, description || null, unitPrice, taxRate || 0, category || null, req.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create saved item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete saved item
router.delete('/:id', async (req: AuthRequest, res: Response) => {
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

// Update saved item
router.put('/:id', [
  body('name').optional().notEmpty(),
  body('unitPrice').optional().isNumeric()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, unitPrice, taxRate, category } = req.body;

    const result = await pool.query(
      `UPDATE saved_items SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        unit_price = COALESCE($3, unit_price),
        tax_rate = COALESCE($4, tax_rate),
        category = COALESCE($5, category),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND company_id = $7
      RETURNING *`,
      [name, description, unitPrice, taxRate, category, req.params.id, req.companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update saved item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

