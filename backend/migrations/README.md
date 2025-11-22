# 🔧 Database Migration - Password Reset

## Run This Migration

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the migration
\i backend/migrations/add_password_reset_fields.sql
```

OR copy-paste this SQL:

```sql
-- Add password reset fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);
```

## Verify It Worked

```sql
-- Check the users table structure
\d users

-- You should see:
-- reset_token | character varying(255) |
-- reset_token_expiry | timestamp without time zone |
```

## Done!

Your database is now ready for the password reset feature. ✅

Restart your backend server, and the password reset endpoints will be live!
