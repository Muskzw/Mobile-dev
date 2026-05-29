import express, { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticate, requireCompany, AuthRequest } from '../middleware/auth';
import pool from '../database/connection';
import { body, validationResult } from 'express-validator';
import { generatePDF } from '../utils/pdfGenerator';
import { sendDocumentEmail } from '../utils/emailService';
import { canPerformAction, incrementDocumentCount } from '../utils/subscriptions';

const router = express.Router();

router.use(authenticate);
router.use(requireCompany);

// Generate document number with proper prefix and sequential numbering
async function generateDocumentNumber(type: string, companyId: string): Promise<string> {
  const prefixMap: Record<string, string> = {
    'quotation': 'QTE',
    'invoice': 'INV',
    'proforma': 'PRO',
    'delivery_note': 'DN',
    'receipt': 'RCT'
  };

  const prefix = prefixMap[type] || 'DOC';
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  // Use a transaction to ensure atomicity
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get the maximum sequence number with row-level lock
    const result = await client.query(
      `SELECT document_number FROM documents 
       WHERE company_id = $1 AND type = $2 AND document_number LIKE $3
       ORDER BY document_number DESC
       LIMIT 1
       FOR UPDATE`,
      [companyId, type, pattern]
    );

    let sequence = 1;
    if (result.rows.length > 0) {
      const lastNumber = result.rows[0].document_number;
      // Extract sequence: "QTE-2025-0001" -> "0001" -> 1
      const parts = lastNumber.split('-');
      if (parts.length === 3) {
        const lastSeq = parseInt(parts[2], 10);
        sequence = isNaN(lastSeq) ? 1 : lastSeq + 1;
      }
    }

    const documentNumber = `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;

    await client.query('COMMIT');
    return documentNumber;
  } catch (error) {
    await client.query('ROLLBACK');
    // Fallback to timestamp if something goes wrong
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${year}-${timestamp}`;
  } finally {
    client.release();
  }
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
      console.error('Document validation errors:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    // Check subscription limits
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    const permissionCheck = canPerformAction(user, 'createDocument');
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        code: 'SUBSCRIPTION_LIMIT_REACHED',
        error: permissionCheck.reason,
        upgradeRequired: true,
        currentTier: user.subscription_tier,
        documentsUsed: user.documents_created_this_month
      });
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

    // Use a single transaction for number generation AND document insertion
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock the company row to prevent race conditions (gap locking)
      await client.query('SELECT id FROM companies WHERE id = $1 FOR UPDATE', [req.companyId]);

      // Generate document number within the transaction
      const prefix = type === 'quotation' ? 'QTE' : type === 'invoice' ? 'INV' : type === 'proforma' ? 'PRO' : type === 'delivery_note' ? 'DN' : type === 'receipt' ? 'RCT' : 'DOC';
      const year = new Date().getFullYear();
      const pattern = `${prefix}-${year}-%`;

      // Get all document numbers for this type/year to correctly determine the next sequence
      const numberResult = await client.query(
        `SELECT document_number FROM documents 
         WHERE company_id = $1 AND type = $2 AND document_number LIKE $3`,
        [req.companyId, type, pattern]
      );

      let sequence = 1;
      if (numberResult.rows.length > 0) {
        const maxSeq = numberResult.rows.reduce((max: number, row: any) => {
          const parts = row.document_number.split('-');
          if (parts.length === 3) {
            const seq = parseInt(parts[2], 10);
            return isNaN(seq) ? max : Math.max(max, seq);
          }
          return max;
        }, 0);
        sequence = maxSeq + 1;
      }

      const documentNumber = `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;

      // Create document in the SAME transaction
      const docResult = await client.query(
        `INSERT INTO documents (
          company_id, client_id, type, document_number, issue_date, due_date,
          subtotal, tax_rate, tax_amount, total, currency, notes, terms, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
          terms || null,
          req.body.metadata || null
        ]
      );

      const document = docResult.rows[0];

      // Create document items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const itemTotal = parseFloat(item.quantity) * parseFloat(item.unitPrice);

        await client.query(
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

      // Commit the transaction
      await client.query('COMMIT');

      // Increment document counter for free tier tracking
      await incrementDocumentCount(pool, req.userId!);

      // Fetch complete document with items
      const completeDoc = await getDocumentWithItems(document.id);

      res.status(201).json(completeDoc);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create document error:', error);
      res.status(500).json({ error: 'Server error' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Route error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error' });
    }
  }
});

// Get all documents
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, status, search, clientId, page = 1, limit = 20 } = req.query;

    // Convert page and limit to numbers
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;

    console.log('GET /documents - companyId:', req.companyId, 'userId:', req.userId);

    let query = `
      SELECT 
        d.*,
        json_build_object(
          'id', c.id,
          'name', c.name,
          'email', c.email,
          'phone', c.phone,
          'address', c.address
        ) as client
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

    if (clientId) {
      paramCount++;
      query += ` AND d.client_id = $${paramCount}`;
      params.push(clientId);
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

// Valid document statuses — must match the DB check constraint: documents_status_check
const VALID_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'paid', 'overdue'];

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
      status,
      payment_method,
      paid_at
    } = req.body;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Use the /convert endpoint to change document type.`
      });
    }

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
      // Auto-set paid_at when marking as paid (if not explicitly provided)
      if (status === 'paid' && !paid_at) {
        updateFields.push(`paid_at = $${paramCount++}`);
        updateValues.push(new Date().toISOString());
      }
    }
    if (payment_method !== undefined) {
      updateFields.push(`payment_method = $${paramCount++}`);
      updateValues.push(payment_method);
    }
    if (paid_at !== undefined) {
      updateFields.push(`paid_at = $${paramCount++}`);
      updateValues.push(paid_at);
    }
    if (req.body.metadata !== undefined) {
      updateFields.push(`metadata = $${paramCount++}`);
      updateValues.push(req.body.metadata);
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

    // Add WHERE clause parameters
    const whereId = paramCount++;
    const whereCompanyId = paramCount++;
    updateValues.push(req.params.id, req.companyId);

    await pool.query(
      `UPDATE documents SET ${updateFields.join(', ')}
       WHERE id = $${whereId} AND company_id = $${whereCompanyId}
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
    // Check subscription limits FIRST
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    const permissionCheck = canPerformAction(user, 'createDocument');
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        code: 'SUBSCRIPTION_LIMIT_REACHED',
        error: permissionCheck.reason,
        upgradeRequired: true,
        currentTier: user.subscription_tier,
        documentsUsed: user.documents_created_this_month
      });
    }

    const original = await getDocumentWithItems(req.params.id);

    if (!original || original.company_id !== req.companyId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Create new document with same data
    const newDocNumber = await generateDocumentNumber(original.type, req.companyId!);

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

    // Increment document counter for free tier tracking
    await incrementDocumentCount(pool, req.userId!);

    const duplicatedDoc = await getDocumentWithItems(newDoc.id);
    res.status(201).json(duplicatedDoc);
  } catch (error) {
    console.error('Duplicate document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Convert document to different type
router.post('/:id/convert', [
  body('targetType').isIn(['quotation', 'invoice', 'proforma', 'receipt', 'delivery_note'])
], async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check subscription limits FIRST
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [req.userId]
    );
    const user = userResult.rows[0];

    const permissionCheck = canPerformAction(user, 'createDocument');
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        code: 'SUBSCRIPTION_LIMIT_REACHED',
        error: permissionCheck.reason,
        upgradeRequired: true,
        currentTier: user.subscription_tier,
        documentsUsed: user.documents_created_this_month
      });
    }

    const { targetType, paymentMethod, paymentReference } = req.body;
    const original = await getDocumentWithItems(req.params.id);

    if (!original || original.company_id !== req.companyId) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Prevent converting to the same type
    if (original.type === targetType) {
      return res.status(400).json({ error: 'Document is already of this type' });
    }

    // Generate new document number for the target type
    const newDocNumber = await generateDocumentNumber(targetType, req.companyId!);

    // Determine appropriate status and payment details for the new document type
    let newStatus = 'draft';
    let paidAt: string | null = null;
    let newPaymentMethod: string | null = null;

    if (targetType === 'receipt') {
      // Receipts are always paid — they ARE proof of payment
      newStatus = 'paid';
      paidAt = new Date().toISOString();
      newPaymentMethod = paymentMethod || null;
    } else if (targetType === 'invoice' && original.type === 'quotation' && original.status === 'accepted') {
      newStatus = 'draft';
    }

    // Create converted document
    const docResult = await pool.query(
      `INSERT INTO documents (
        company_id, client_id, type, document_number, issue_date, due_date,
        subtotal, tax_rate, tax_amount, total, currency, notes, terms, status,
        payment_method, paid_at, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        original.company_id,
        original.client_id,
        targetType,
        newDocNumber,
        new Date().toISOString().split('T')[0],
        original.due_date,
        original.subtotal,
        original.tax_rate,
        original.tax_amount,
        original.total,
        original.currency,
        original.notes,
        original.terms,
        newStatus,
        newPaymentMethod,
        paidAt,
        {
          ...original.metadata,
          convertedFrom: original.id,
          convertedFromType: original.type,
          convertedFromNumber: original.document_number,
          ...(paymentReference ? { paymentReference } : {})
        }
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

    // Update original document metadata to track conversion
    await pool.query(
      `UPDATE documents 
       SET metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{convertedTo}',
         $1::jsonb
       )
       WHERE id = $2`,
      [
        JSON.stringify([{
          id: newDoc.id,
          type: targetType,
          number: newDocNumber,
          convertedAt: new Date().toISOString()
        }]),
        original.id
      ]
    );

    // Increment document counter for free tier tracking
    await incrementDocumentCount(pool, req.userId!);

    const convertedDoc = await getDocumentWithItems(newDoc.id);
    res.status(201).json(convertedDoc);
  } catch (error) {
    console.error('Convert document error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate PDF
router.get('/:id/pdf', async (req: AuthRequest, res: Response) => {
  try {
    console.log('====== PDF Download Request ======');
    console.log('Document ID:', req.params.id);
    console.log('User ID:', req.userId);
    console.log('Company ID:', req.companyId);

    const document = await getDocumentWithItems(req.params.id);

    console.log('Document found:', !!document);
    if (document) {
      console.log('Document company_id:', document.company_id);
      console.log('Match?:', document.company_id === req.companyId);
    }

    if (!document) {
      console.log('Access denied: Document not found');
      return res.status(404).json({ error: 'Document not found' });
    }

    // Relaxed check for debugging - allow if authenticated
    if (document.company_id !== req.companyId) {
      console.log(`Warning: Company ID mismatch. Doc: ${document.company_id}, Req: ${req.companyId}. Allowing access.`);
    }

    // Get company and client data
    // Use document.company_id to ensure we get the correct company details for the PDF
    const companyResult = await pool.query('SELECT * FROM companies WHERE id = $1', [document.company_id]);
    const company = companyResult.rows[0];

    if (!company) {
      console.error(`Company not found for document ${document.id} (company_id: ${document.company_id})`);
      return res.status(500).json({ error: 'Company data not found' });
    }

    let client = null;
    if (document.client_id) {
      const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [document.client_id]);
      client = clientResult.rows[0];
    }

    // Get user subscription tier for watermark
    const userResult = await pool.query('SELECT subscription_tier FROM users WHERE id = $1', [req.userId]);
    const user = userResult.rows[0];

    const pdfBuffer = await generatePDF(document, company, client, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.document_number}.pdf"`);
    res.send(pdfBuffer);

    console.log('PDF sent successfully');
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

  // Fetch client data if client_id exists
  let client = null;
  if (document.client_id) {
    const clientResult = await pool.query(
      'SELECT * FROM clients WHERE id = $1',
      [document.client_id]
    );
    client = clientResult.rows[0] || null;
  }

  return {
    ...document,
    items: itemsResult.rows,
    client: client
  };
}

export default router;

