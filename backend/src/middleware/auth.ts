import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../database/connection';

export interface AuthRequest extends Request {
  userId?: string;
  companyId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
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
