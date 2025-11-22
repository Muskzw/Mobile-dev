import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../database/connection';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Password Reset Request
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

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

        // Generate reset token (valid for 1 hour)
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

        // TODO: Send email with reset link
        // In production, integrate with SendGrid, AWS SES, or similar
        // For now, log the reset token (REMOVE IN PRODUCTION)
        console.log('='.repeat(50));
        console.log('PASSWORD RESET REQUEST');
        console.log('User:', user.email);
        console.log('Reset Token:', resetToken);
        console.log('Reset Link:', `http://yourapp.com/reset-password?token=${resetToken}`);
        console.log('='.repeat(50));

        // In development, you might want to return the token for testing
        // REMOVE THIS IN PRODUCTION
        if (process.env.NODE_ENV === 'development') {
            return res.json({
                message: 'Password reset token generated',
                token: resetToken, // REMOVE IN PRODUCTION
                resetLink: `http://yourapp.com/reset-password?token=${resetToken}`
            });
        }

        res.json({
            message: 'If an account exists with that email, you will receive password reset instructions.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Failed to process password reset request' });
    }
});

// Reset Password (with token)
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Hash the token to compare with database
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

export default router;
