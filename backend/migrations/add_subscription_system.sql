-- Add subscription tiers and limits to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS documents_created_this_month INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_reset_date DATE DEFAULT CURRENT_DATE;

-- Update existing users to free tier
UPDATE users SET subscription_tier = 'free' WHERE subscription_tier IS NULL;

-- Create index for faster subscription queries
CREATE INDEX IF NOT EXISTS idx_users_subscription ON users(subscription_tier, subscription_expires_at);

-- Add comment for documentation
COMMENT ON COLUMN users.subscription_tier IS 'Subscription tier: free, premium, business';
COMMENT ON COLUMN users.documents_created_this_month IS 'Track monthly document creation for limits';
