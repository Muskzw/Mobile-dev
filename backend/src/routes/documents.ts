import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireCompany, AuthRequest } from '../middleware/auth';
import pool from '../database/connection';
import { body, validationResult } from 'express-validator';
import { generatePDF } from '../utils/pdfGenerator';
import { sendDocumentEmail } from '../utils/emailService';

const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

// Generate document number
function generateDocumentNumber(type: string, companyId: string): string {
  const prefix = type.substring(0, 3).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

// Create document
router.post('/', [
  body('type').isIn(['quotation', 'invoice', 'proforma', 'receipt', 'delivery_note']),
  body('clientId').optional().isUUID(),
  body('items').isArray({ min: 1 })
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      type,
      clientId,
      issueDate,
      dueDate,
      items,
      notes,
      terms,
      taxRate
    } = req.body;

    // Calculate totals
    let subtotal = 0;
    items.forEach((item: any) => {
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      subtotal += itemTotal;
    });

    const taxAmount = subtotal * (parseFloat(taxRate || 0) / 100);
    const total = subtotal + taxAmount;

    // Get company currency
    const companyResult = await pool.query('SELECT currency FROM companies WHERE id = $1', [req.companyId]);
    const currency = companyResult.rows[0]?.currency || 'USD';

    const documentNumber = generateDocumentNumber(type, req.companyId!);

    // Create document
    const docResult = await pool.query(
      `INSERT INTO documents (
        company_id, client_id, type, document_number, issue_date, due_date,
        subtotal, tax_rate, tax_amount, total, currency, notes, terms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        req.companyId,
        clientId || null,
        type,
        documentNumber,
        issueDate || new Date().toISOString().split('T')[0],
        dueDate || null,
        subtotal,
        taxRate || 0,
        taxAmount,
        total,
        currency,
        notes || null,
        terms || null
      ]
    );

    const document = docResult.rows[0];

    // Create document items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      
      await pool.query(
        `INSERT INTO document_items (
          document_id, name, description, quantity, unit_price, tax_rate, total, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          document.id,
          item.name,
          item.description || null,
          item.quantity,
          item.unitPrice,
          item.taxRate || 0,
          itemTotal,
          i
        ]
      );
    }

    // Fetch complete document with items
    const completeDoc = await getDocumentWithItems(document.id);

    res.status(201).json(completeDoc);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all documents
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    
    let query = `
      SELECT d.*, c.name as client_name, c.email as client_email
      FROM documents d
      LEFT JOIN clients c ON d.client_id = c.id
      WHERE d.company_id = $1
    `;
    const params: any[] = [req.companyId];
    let paramCount = 1;

    if (type) {
      paramCount++;
      query += ` AND d.type = $${paramCount}`;
      params.push(type);
    }

    if (status) {
      paramCount++;
      query += ` AND d.status = $${paramCount}`;
      params.push(status);
    }

    if (search) {
      paramCount++;
      query += ` AND (d.document_number ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY d.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limitNum, (pageNum - 1) * limitNum);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single document
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const document = await getDocumentWithItems(req.params.id);
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify ownership
    if (document.company_id !== req.companyId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update document
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const {
      clientId,
      issueDate,
      dueDate,
      items,
      notes,
      terms,
      taxRate,
      status
    } = req.body;

    // Verify ownership
    const docCheck = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND company_id = $2',
      [req.params.id, req.companyId]
    );

    if (docCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // If items are updated, recalculate totals
    let updateData: any = {};
    if (items) {
      let subtotal = 0;
      items.forEach((item: any) => {
        subtotal += parseFloat(item.quantity) * parseFloat(item.unitPrice);
      });
      const taxAmount = subtotal * (parseFloat(taxRate || 0) / 100);
      updateData.subtotal = subtotal;
      updateData.tax_amount = taxAmount;
      updateData.total = subtotal + taxAmount;
    }

    // Update document
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (clientId !== undefined) {
      updateFields.push(`client_id = $${paramCount++}`);
      updateValues.push(clientId);
    }
    if (issueDate) {
      updateFields.push(`issue_date = $${paramCount++}`);
      updateValues.push(issueDate);
    }
    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${paramCount++}`);
      updateValues.push(dueDate);
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount++}`);
      updateValues.push(notes);
    }
    if (terms !== undefined) {
      updateFields.push(`terms = $${paramCount++}`);
      updateValues.push(terms);
    }
    if (taxRate !== undefined) {
      updateFields.push(`tax_rate = $${paramCount++}`);
      updateValues.push(taxRate);
    }
    if (status) {
      updateFields.push(`status = $${paramCount++}`);
      updateValues.push(status);
    }
    if (updateData.subtotal !== undefined) {
      updateFields.push(`subtotal = $${paramCount++}`);
      updateValues.push(updateData.subtotal);
      updateFields.push(`tax_amount = $${paramCount++}`);
      updateValues.push(updateData.tax_amount);
      updateFields.push(`total = $${paramCount++}`);
      updateValues.push(updateData.total);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(req.params.id, req.companyId);

    await pool.query(
      `UPDATE documents SET ${updateFields.join(', ')}
       WHERE id = $${paramCount++} AND company_id = $${paramCount++}
       RETURNING *`,
      updateValues
    );

    // Update items if provided
    if (items) {
      // Delete old items
      await pool.query('DELETE FROM document_items WHERE document_id = $1', [req.params.id]);
      
      // Insert new items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);
        
        await pool.query(
          `INSERT INTO document_items (
            document_id, name, description, quantity, unit_price, tax_rate, total, sort_order
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            req.params.id,
            item.name,
            item.description || null,
            item.quantity,
            item.unitPrice,
            item.taxRate || 0,
            itemTotal,
            i
          ]
        );
      }
    }

    const updatedDoc = await getDocumentWithItems(req.params.id);
    res.json(updatedDoc);
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete document
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ message: 'Document deleted' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Duplicate document
router.post('/:id/duplicate', async (req: AuthRequest, res: Response) => {
  try {
    const original = await getDocumentWithItems(req.params.id);
    
    if (!original || original.company_id !== req.companyId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Create new document with same data
    const newDocNumber = generateDocumentNumber(original.type, req.companyId!);
    
    const docResult = await pool.query(
      `INSERT INTO documents (
        company_id, client_id, type, document_number, issue_date, due_date,
        subtotal, tax_rate, tax_amount, total, currency, notes, terms, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft')
      RETURNING *`,
      [
        original.company_id,
        original.client_id,
        original.type,
        newDocNumber,
        new Date().toISOString().split('T')[0],
        original.due_date,
        original.subtotal,
        original.tax_rate,
        original.tax_amount,
        original.total,
        original.currency,
        original.notes,
        original.terms
      ]
    );

    const newDoc = docResult.rows[0];

    // Copy items
    for (const item of original.items) {
      await pool.query(
        `INSERT INTO document_items (
          document_id, name, description, quantity, unit_price, tax_rate, total, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          newDoc.id,
          item.name,
          item.description,
          item.quantity,
          item.unit_price,
          item.tax_rate,
          item.total,
          item.sort_order
        ]
      );
    }

    const duplicatedDoc = await getDocumentWithItems(newDoc.id);
    res.status(201).json(duplicatedDoc);
  } catch (error) {
    console.error('Duplicate document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate PDF
router.get('/:id/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const document = await getDocumentWithItems(req.params.id);
    
    if (!document || document.company_id !== req.companyId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get company and client data
    const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [req.companyId]);
    const company = companyResult.rows[0];

    let client = null;
    if (document.client_id) {
      const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [document.client_id]);
      client = clientResult.rows[0];
    }

    const pdfBuffer = await generatePDF(document, company, client);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.document_number}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send document via email
router.post('/:id/send-email', [
  body('email').isEmail(),
  body('subject').optional()
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const document = await getDocumentWithItems(req.params.id);
    
    if (!document || document.company_id !== req.companyId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get company and client data
    const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [req.companyId]);
    const company = companyResult.rows[0];

    let client = null;
    if (document.client_id) {
      const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [document.client_id]);
      client = clientResult.rows[0];
    }

    const pdfBuffer = await generatePDF(document, company, client);
    const docType = document.type.charAt(0).toUpperCase() + document.type.slice(1).replace('_', ' ');
    const subject = req.body.subject || `${docType} ${document.document_number}`;

    await sendDocumentEmail(
      req.body.email,
      subject,
      document.document_number,
      pdfBuffer,
      company.name
    );

    // Update document status if it's a quotation or invoice
    if (document.status === 'draft') {
      await pool.query(
        'UPDATE documents SET status = $1 WHERE id = $2',
        ['sent', req.params.id]
      );
    }

    res.json({ message: 'Document sent successfully' });
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Get WhatsApp share link
router.get('/:id/whatsapp-link', async (req: AuthRequest, res: Response) => {
  try {
    const document = await getDocumentWithItems(req.params.id);
    
    if (!document || document.company_id !== req.companyId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Get client phone if available
    let phone = req.query.phone as string;
    if (!phone && document.client_id) {
      const clientResult = await pool.query('SELECT phone FROM clients WHERE id = $1', [document.client_id]);
      phone = clientResult.rows[0]?.phone;
    }

    const docType = document.type.charAt(0).toUpperCase() + document.type.slice(1).replace('_', ' ');
    const message = encodeURIComponent(
      `Hello! Please find your ${docType} ${document.document_number}.\n\n` +
      `Total: ${document.currency} ${parseFloat(document.total).toFixed(2)}\n\n` +
      `View and download: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/documents/${document.id}`
    );

    const whatsappLink = phone
      ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`
      : `https://wa.me/?text=${message}`;

    res.json({ link: whatsappLink });
  } catch (error) {
    console.error('WhatsApp link error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to get document with items
async function getDocumentWithItems(documentId: string) {
  const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [documentId]);
  
  if (docResult.rows.length === 0) {
    return null;
  }

  const document = docResult.rows[0];
  const itemsResult = await pool.query(
    'SELECT * FROM document_items WHERE document_id = $1 ORDER BY sort_order ASC',
    [documentId]
  );

  return {
    ...document,
    items: itemsResult.rows
  };
}

export default router;

