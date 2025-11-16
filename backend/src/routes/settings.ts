import express, { Response } from 'express';
import { authenticate, requireCompany, AuthRequest } from '../middleware/auth';
import pool from '../database/connection';

const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

// Get settings
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT key, value FROM settings 
       WHERE company_id = $1 AND user_id = $2`,
      [req.companyId, req.userId]
    );

    const settings: any = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });

    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update settings
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO settings (company_id, user_id, key, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, user_id, key)
         DO UPDATE SET value = $4, updated_at = CURRENT_TIMESTAMP`,
        [req.companyId, req.userId, key, JSON.stringify(value)]
      );
    }

    res.json({ message: 'Settings updated' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

