-- Add new columns to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_line2 TEXT,
ADD COLUMN IF NOT EXISTS address_line3 TEXT,
ADD COLUMN IF NOT EXISTS business_label VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS business_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_instructions TEXT;

-- Update phone column if it doesn't exist
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
