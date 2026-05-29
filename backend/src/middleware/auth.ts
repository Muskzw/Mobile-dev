import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';

export interface AuthRequest extends Request {
  userId?: string;
  companyId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (token === 'mock-token') {
      // Find or create a default user in the database
      const userRes = await pool.query("SELECT id FROM users WHERE email = 'esitholezw@gmail.com' LIMIT 1");
      let userId;
      if (userRes.rows.length > 0) {
        userId = userRes.rows[0].id;
      } else {
        const insertUser = await pool.query(
          "INSERT INTO users (email, password_hash, full_name, subscription_status) VALUES ('esitholezw@gmail.com', 'mock-hash', 'Admin User', 'active') RETURNING id"
        );
        userId = insertUser.rows[0].id;
      }
      req.userId = userId;

      // Find or create a default company for this user
      const compRes = await pool.query("SELECT id FROM companies WHERE user_id = $1 LIMIT 1", [userId]);
      let companyId;
      if (compRes.rows.length > 0) {
        companyId = compRes.rows[0].id;
      } else {
        const insertComp = await pool.query(
          "INSERT INTO companies (user_id, name, email) VALUES ($1, 'My Company', 'esitholezw@gmail.com') RETURNING id",
          [userId]
        );
        companyId = insertComp.rows[0].id;
      }
      req.companyId = companyId;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    req.userId = decoded.userId;

    // Extract company ID from header if present
    const companyId = req.headers['x-company-id'] as string;
    console.log('Auth Middleware - x-company-id header:', companyId);
    console.log('Auth Middleware - userId:', req.userId);
    if (companyId) {
      req.companyId = companyId;
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Single-tenant mode - no company required
export const requireCompany = (req: AuthRequest, res: Response, next: NextFunction) => {
  // In single-tenant mode, we don't require company
  // Just pass through
  next();
};

