import express from 'express';
import pool from '../database/connection';

const router = express.Router();

router.post('/revenuecat', async (req, res) => {
    try {
        const { event } = req.body;

        if (!event) {
            return res.status(400).json({ error: 'Invalid event data' });
        }

        const { type, app_user_id, product_id, expiration_at_ms } = event;

        console.log(`Received RevenueCat event: ${type} for user ${app_user_id}`);

        // Map product_id to tier
        // You should adjust these checks based on your actual RevenueCat product identifiers
        let tier = 'free';
        if (product_id?.toLowerCase().includes('premium')) tier = 'premium';
        if (product_id?.toLowerCase().includes('business')) tier = 'business';

        // Handle different event types
        if (type === 'INITIAL_PURCHASE' || type === 'RENEWAL' || type === 'UNCANCELLATION') {
            // Update user subscription
            await pool.query(
                `UPDATE users 
         SET subscription_tier = $1, 
             subscription_expires_at = to_timestamp($2 / 1000.0),
             subscription_started_at = NOW()
         WHERE id = $3`,
                [tier, expiration_at_ms, app_user_id]
            );
            console.log(`Updated user ${app_user_id} to tier ${tier}`);
        } else if (type === 'EXPIRATION') {
            // Downgrade to free on expiration
            await pool.query(
                `UPDATE users 
          SET subscription_tier = 'free', 
              subscription_expires_at = NULL
          WHERE id = $1`,
                [app_user_id]
            );
            console.log(`Downgraded user ${app_user_id} to free tier`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router;
