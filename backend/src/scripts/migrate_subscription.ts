import pool from '../database/connection';

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting subscription migration...');

        // Add subscription_status column
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'trial'
    `);

        // Add trial_ends_at column
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP
    `);

        // Add subscription_ends_at column
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP
    `);

        // Update existing users to have a trial ending 30 days from now (or based on creation if we wanted to be strict, but let's give them a fresh trial)
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);

        await client.query(`
      UPDATE users 
      SET trial_ends_at = $1, subscription_status = 'trial' 
      WHERE trial_ends_at IS NULL
    `, [futureDate]);

        console.log('✅ Migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
