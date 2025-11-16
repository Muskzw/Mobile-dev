import pool from './connection';

export async function createTables() {
  const client = await pool.connect();
  
  try {
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        logo_url VARCHAR(500),
        address TEXT,
        phone VARCHAR(50),
        email VARCHAR(255),
        tax_number VARCHAR(100),
        registration_number VARCHAR(100),
        currency VARCHAR(10) DEFAULT 'USD',
        brand_color VARCHAR(7) DEFAULT '#3B82F6',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        tax_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Documents table (quotations, invoices, etc.)
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('quotation', 'invoice', 'proforma', 'receipt', 'delivery_note')),
        document_number VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'paid', 'overdue')),
        issue_date DATE NOT NULL,
        due_date DATE,
        subtotal DECIMAL(12, 2) DEFAULT 0,
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        tax_amount DECIMAL(12, 2) DEFAULT 0,
        total DECIMAL(12, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'USD',
        notes TEXT,
        terms TEXT,
        payment_method VARCHAR(50),
        paid_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Document items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        quantity DECIMAL(10, 2) NOT NULL,
        unit_price DECIMAL(12, 2) NOT NULL,
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        total DECIMAL(12, 2) NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Saved items/services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS saved_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        unit_price DECIMAL(12, 2) NOT NULL,
        tax_rate DECIMAL(5, 2) DEFAULT 0,
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // AI insights table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_insights (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
        insight_type VARCHAR(50) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        key VARCHAR(100) NOT NULL,
        value JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(company_id, user_id, key)
      )
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_companies_user_id ON companies(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_clients_company_id ON clients(company_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_document_items_document_id ON document_items(document_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_saved_items_company_id ON saved_items(company_id)`);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

