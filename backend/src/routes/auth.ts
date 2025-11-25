import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('fullName').optional().trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName } = req.body;

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, subscription_status, trial_ends_at) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, subscription_status, trial_ends_at, created_at',
      [email, passwordHash, fullName || null, 'trial', trialEndsAt]
    );

    const user = userResult.rows[0];

    // Create default company
    const companyResult = await pool.query(
      'INSERT INTO companies (user_id, name, email) VALUES ($1, $2, $3) RETURNING *',
      [user.id, `${fullName || 'My'} Company`, email]
    );
    const company = companyResult.rows[0];

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        subscriptionStatus: user.subscription_status,
        trialEndsAt: user.trial_ends_at
      },
      companies: [company]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const jwtSecret = process.env.JWT_SECRET || 'secret';
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '7d' } as jwt.SignOptions
    );

    // Get user's companies
    const companiesResult = await pool.query(
      'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC',
      [user.id]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      },
      companies: companiesResult.rows
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userResult = await pool.query('SELECT id, email, full_name, created_at FROM users WHERE id = $1', [req.userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const companiesResult = await pool.query(
      'SELECT * FROM companies WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json({
      user: userResult.rows[0],
      companies: companiesResult.rows
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password - Request reset token
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      [email]
    );

    // Always return success to prevent email enumeration attacks
    if (userResult.rows.length === 0) {
      return res.json({
        message: 'If an account exists with that email, you will receive password reset instructions.'
      });
    }

    const user = userResult.rows[0];

    // Generate reset token (using crypto for security)
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_token_expiry = $2 
       WHERE id = $3`,
      [resetTokenHash, resetTokenExpiry, user.id]
    );

    // Send password reset email
    const { sendPasswordResetEmail } = require('../utils/email');
    await sendPasswordResetEmail(user.email, user.full_name || 'User', resetToken);

    res.json({
      message: 'If an account exists with that email, you will receive password reset instructions.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

// Reset Password - Validate token and update password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, newPassword } = req.body;

    // Hash the token to compare with database
    const crypto = require('crypto');
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid reset token
    const userResult = await pool.query(
      `SELECT id, email FROM users 
       WHERE reset_token = $1 
       AND reset_token_expiry > NOW()`,
      [resetTokenHash]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = userResult.rows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password has been reset successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Update subscription (called after RevenueCat purchase)
router.put('/users/subscription', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { tier, subscriptionId } = req.body;
    const userId = req.userId;

    if (!['free', 'premium', 'business'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    await pool.query(
      `UPDATE users 
       SET subscription_tier = $1,
           subscription_started_at = CASE WHEN $1 != 'free' THEN NOW() ELSE subscription_started_at END,
           updated_at = NOW()
       WHERE id = $2`,
      [tier, userId]
    );

    // Reset document counter if upgrading from free
    if (tier !== 'free') {
      await pool.query(
        `UPDATE users SET documents_created_this_month = 0 WHERE id = $1`,
        [userId]
      );
    }

    const updatedUser = await pool.query(
      'SELECT id, email, full_name, subscription_tier, subscription_started_at FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      message: 'Subscription updated successfully',
      user: updatedUser.rows[0],
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

export default router;

