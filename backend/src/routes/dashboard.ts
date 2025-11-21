import express, { Response } from 'express';
import { authenticate, requireCompany, AuthRequest } from '../middleware/auth';
import pool from '../database/connection';

const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

// Get dashboard stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    // Total quotations
    const quotationsResult = await pool.query(
      `SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected
       FROM documents
       WHERE company_id = $1 AND type = 'quotation'`,
      [req.companyId]
    );

    // Total invoices
    const invoicesResult = await pool.query(
      `SELECT COUNT(*) as total,
        COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as total_paid,
        SUM(CASE WHEN status != 'paid' THEN total ELSE 0 END) as total_pending
       FROM documents
       WHERE company_id = $1 AND type = 'invoice'`,
      [req.companyId]
    );

    // Upcoming deadlines (next 7 days)
    const deadlinesResult = await pool.query(
      `SELECT COUNT(*) as count
       FROM documents
       WHERE company_id = $1 
       AND due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
       AND status NOT IN ('paid', 'rejected')`,
      [req.companyId]
    );

    // Recent activity (last 10 documents)
    const recentResult = await pool.query(
      `SELECT d.*, c.name as client_name
       FROM documents d
       LEFT JOIN clients c ON d.client_id = c.id
       WHERE d.company_id = $1
       ORDER BY d.updated_at DESC
       LIMIT 10`,
      [req.companyId]
    );

    // Total clients
    const clientsResult = await pool.query(
      `SELECT COUNT(*) as total FROM clients WHERE company_id = $1 OR user_id = $2`,
      [req.companyId, req.userId]
    );

    res.json({
      quotations: {
        total: parseInt(quotationsResult.rows[0].total),
        draft: parseInt(quotationsResult.rows[0].draft),
        sent: parseInt(quotationsResult.rows[0].sent),
        accepted: parseInt(quotationsResult.rows[0].accepted),
        rejected: parseInt(quotationsResult.rows[0].rejected),
        pending: parseInt(quotationsResult.rows[0].sent) + parseInt(quotationsResult.rows[0].draft)
      },
      invoices: {
        total: parseInt(invoicesResult.rows[0].total),
        paid: parseInt(invoicesResult.rows[0].paid),
        overdue: parseInt(invoicesResult.rows[0].overdue),
        totalPaid: parseFloat(invoicesResult.rows[0].total_paid || 0),
        totalPending: parseFloat(invoicesResult.rows[0].total_pending || 0)
      },
      clients: {
        total: parseInt(clientsResult.rows[0].total)
      },
      upcomingDeadlines: parseInt(deadlinesResult.rows[0].count),
      recentActivity: recentResult.rows
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

