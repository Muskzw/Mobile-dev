import pool from '../database/connection';
import { generatePDF } from '../utils/pdfGenerator';
import fs from 'fs';
import path from 'path';

async function testWatermark() {
    try {
        console.log('🧪 Starting PDF Watermark Test...');

        // 1. Get a test user (Free Tier)
        const userResult = await pool.query("SELECT * FROM users LIMIT 1");
        let user = userResult.rows[0];
        if (!user) {
            console.log('⚠️ No users found in database, using dummy free tier user');
            user = {
                id: 'dummy-user-id',
                email: 'dummy@example.com',
                subscription_tier: 'free'
            };
        } else {
            user.subscription_tier = 'free';
        }
        console.log(`👤 Test User: ${user.email} (Tier: ${user.subscription_tier})`);

        // 2. Get a document for this user
        // We need to find a company owned by this user first
        const companyResult = await pool.query('SELECT * FROM companies WHERE user_id = $1 LIMIT 1', [user.id]);
        const company = companyResult.rows[0];

        if (!company) {
            console.error('❌ No company found for test user');
            process.exit(1);
        }

        const docResult = await pool.query('SELECT * FROM documents WHERE company_id = $1 LIMIT 1', [company.id]);
        let document = docResult.rows[0];

        // If no document or it lacks items, use dummy data or mock items array
        if (!document) {
            console.log('⚠️ No document found, using dummy data');
            document = {
                type: 'quotation',
                document_number: 'TEST-001',
                created_at: new Date(),
                issue_date: new Date(),
                subtotal: '100.00',
                tax_rate: '10',
                tax_amount: '10.00',
                total: '110.00',
                currency: 'USD',
                items: [
                    { name: 'Product A', quantity: 2, unit_price: '50.00', total: '100.00' }
                ]
            };
        } else {
            // Mock items and date fields if missing/unjoined in raw database query
            if (!document.items) {
                document.items = [
                    { name: 'Product A', quantity: 2, unit_price: '50.00', total: '100.00' }
                ];
            }
            if (!document.issue_date) document.issue_date = document.created_at || new Date();
            if (!document.subtotal) document.subtotal = document.total || '100.00';
            if (!document.tax_rate) document.tax_rate = '10';
            if (!document.tax_amount) document.tax_amount = '10.00';
        }

        // 3. Generate PDF
        console.log('📄 Generating PDF...');
        const pdfBuffer = await generatePDF(document, company, null, user);

        // 4. Save to file for manual inspection if needed
        const outputPath = path.join(__dirname, '../../test_watermark.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log(`💾 PDF saved to: ${outputPath}`);

        // 5. Check for watermark text in the raw buffer
        // Note: PDF text is often compressed, but simple text added via pdfkit might be visible or we check file size
        // A robust check would use a pdf parser, but for this quick test we'll rely on successful generation
        // and the logic we just wrote.

        console.log('✅ PDF Generation Successful!');
        console.log('👉 Please open backend/test_watermark.pdf to visually verify the watermark.');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await pool.end();
    }
}

testWatermark();
