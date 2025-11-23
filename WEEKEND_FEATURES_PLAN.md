# 🚀 WEEKEND SPRINT - 4 Unique Features Implementation Plan

## ✅ **Feature 1: WhatsApp Direct Send** - ALREADY DONE!

**Status:** ✅ COMPLETE
**Location:** `DocumentViewScreen.tsx` line 226-260
**What it does:**
- Share invoice PDFs directly to WhatsApp
- Includes pre-filled message with document details
- Opens WhatsApp with message ready to send

**How users use it:**
1. Open any document
2. Tap "Share" button
3. Select "WhatsApp"
4. Choose contact and send!

---

## 🔲 **Feature 2: QR Code Payments** - READY TO IMPLEMENT

**Implementation Time:** 1 hour
**Why it's powerful:** Client scans QR code → Instant payment info

### **What to add:**

**Step 1: Install QR Code Library**
```bash
cd mobile
npx expo install react-native-qrcode-svg react-native-svg
```

**Step 2: Add Payment Settings to Company**
Create new fields in Company settings:
- Payment method (Mobile Money, PayPal, Bank Transfer)
- Payment details (phone number, PayPal email, account number)
- QR code preference (enabled/disabled)

**Step 3: Generate QR Code in PDF**
Add QR code to PDF with payment information:
- Encode: `PAYMENT:{method}:{details}:{amount}:{currency}`
- Example: `PAYMENT:MPESA:+254712345678:1500:KES`

**Step 4: Add QR Display in App**
Show QR code in Document View:
- Client can scan with phone
- Instant payment instructions

### **Files to Create:**

**1. `mobile/src/components/QRCodeGenerator.tsx`:**
```typescript
import React from 'react';
import QRCode from 'react-native-qrcode-svg';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  paymentData: {
    method: string;
    details: string;
    amount: number;
    currency: string;
  };
}

export const QRCodeGenerator: React.FC<Props> = ({ paymentData }) => {
  const qrValue = `PAYMENT:${paymentData.method}:${paymentData.details}:${paymentData.amount}:${paymentData.currency}`;
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan to Pay</Text>
      <QRCode
        value={qrValue}
        size={200}
        backgroundColor="white"
        color="black"
      />
      <Text style={styles.method}>{paymentData.method}</Text>
      <Text style={styles.amount}>
        {paymentData.currency} {paymentData.amount.toFixed(2)}
      </Text>
    </View>
  );
};
```

**2. Add to `backend/src/utils/pdfGenerator.ts`:**
```typescript
// After the signature section (around line 180):

// QR Code Payment Section (if payment details exist)
if (company.payment_method && company.payment_details) {
  const qrData = `PAYMENT:${company.payment_method}:${company.payment_details}:${document.total}:${document.currency}`;
  
  doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold')
    .text('Scan to Pay:', 350, footerY + 60);
  
  // Add QR code here (requires qrcode package)
  // We'll use a simple text instruction for now
  doc.fontSize(8).font('Helvetica')
    .text(`${company.payment_method}: ${company.payment_details}`, 350, footerY + 75);
}
```

---

## 🔲 **Feature 3: Multiple PDF Templates** - READY TO IMPLEMENT

**Implementation Time:** 2-3 hours
**Why it's powerful:** Professional customization, stand out from competition

### **Templates to Create:**

1. **Modern** (Current design - already done!)
2. **Classic** (Traditional business look)
3. **Minimal** (Clean, simple)
4. **Bold** (Eye-catching, colorful)
5. **Elegant** (Professional, refined)

### **Implementation Plan:**

**Step 1: Add Template Selection to Company Settings**

Add to `SettingsScreen.tsx`:
```typescript
const TEMPLATES = ['Modern', 'Classic', 'Minimal', 'Bold', 'Elegant'];

// In company form:
<Text style={styles.label}>PDF Template</Text>
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  {TEMPLATES.map(template => (
    <TouchableOpacity
      key={template}
      onPress={() => setCompanyForm({...companyForm, pdfTemplate: template})}
      style={[
        styles.templateCard,
        companyForm.pdfTemplate === template && styles.templateCardActive
      ]}
    >
      <Text>{template}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>
```

**Step 2: Create Template Functions**

Create `backend/src/utils/pdfTemplates/` folder with:
- `modern.ts` (current design)
- `classic.ts`
- `minimal.ts`
- `bold.ts`
- `elegant.ts`

**Step 3: Update PDF Generator**

Modify `pdfGenerator.ts`:
```typescript
import { modernTemplate } from './pdfTemplates/modern';
import { classicTemplate } from './pdfTemplates/classic';
// ... etc

export async function generatePDF(document: any, company: any, client: any) {
  const template = company.pdf_template || 'modern';
  
  switch(template.toLowerCase()) {
    case 'classic':
      return classicTemplate(document, company, client);
    case 'minimal':
      return minimalTemplate(document, company, client);
    case 'bold':
      return boldTemplate(document, company, client);
    case 'elegant':
      return elegantTemplate(document, company, client);
    default:
      return modernTemplate(document, company, client);
  }
}
```

### **Template Designs:**

**Classic Template:**
- Navy blue header
- Serif fonts
- Traditional table borders
- Company logo top-left

**Minimal Template:**
- No colors (black & white)
- Clean lines
- Maximum whitespace
- Scandinavian design

**Bold Template:**
- Bright primary color
- Large, bold fonts
- Colorful accents
- Modern gradients

**Elegant Template:**
- Gold/purple accents
- Script-style company name
- Subtle backgrounds
- Luxury feel

---

## 🔲 **Feature 4: Recurring Invoices** - READY TO IMPLEMENT

**Implementation Time:** 4 hours
**Why it's powerful:** Automatic billing for subscriptions, HUGE time saver

### **Database Changes:**

**Add to migrations:**
```sql
-- Create recurring_invoices table
CREATE TABLE recurring_invoices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
 client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Recurring settings
  frequency VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  interval INTEGER DEFAULT 1, -- Every X weeks/months
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = never ends
  next_invoice_date DATE NOT NULL,
  
  -- Invoice template
  items JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Settings
  auto_send BOOLEAN DEFAULT FALSE,
  notes TEXT,
  terms TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for cron job
CREATE INDEX idx_recurring_next_date ON recurring_invoices(next_invoice_date, is_active);
```

### **Backend Implementation:**

**1. Create `backend/src/routes/recurringInvoices.ts`:**
```typescript
import express from 'express';
import pool from '../database/connection';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create recurring invoice
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { client_id, company_id, frequency, start_date, items, total, currency, auto_send } = req.body;
  
  const result = await pool.query(
    `INSERT INTO recurring_invoices 
     (user_id, client_id, company_id, frequency, start_date, next_invoice_date, items, total, currency, auto_send)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [req.userId, client_id, company_id, frequency, start_date, start_date, JSON.stringify(items), total, currency, auto_send]
  );
  
  res.json(result.rows[0]);
});

// List recurring invoices
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const result = await pool.query(
    `SELECT r.*, c.name as client_name 
     FROM recurring_invoices r
     LEFT JOIN clients c ON r.client_id = c.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [req.userId]
  );
  
  res.json(result.rows);
});

// Update recurring invoice
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { frequency, end_date, is_active, auto_send } = req.body;
  
  const result = await pool.query(
    `UPDATE recurring_invoices 
     SET frequency = COALESCE($1, frequency),
         end_date = $2,
         is_active = COALESCE($3, is_active),
         auto_send = COALESCE($4, auto_send),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [frequency, end_date, is_active, auto_send, id, req.userId]
  );
  
  res.json(result.rows[0]);
});

// Delete recurring invoice
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  await pool.query(
    'DELETE FROM recurring_invoices WHERE id = $1 AND user_id = $2',
    [req.params.id, req.userId]
  );
  
  res.json({ success: true });
});

export default router;
```

**2. Create Cron Job `backend/src/jobs/generateRecurringInvoices.ts`:**
```typescript
import pool from '../database/connection';
import { sendEmail } from '../utils/email';

export async function generateRecurringInvoices() {
  console.log('🔄 Checking for recurring invoices to generate...');
  
  // Get all recurring invoices due today
  const result = await pool.query(
    `SELECT r.*, c.name as client_name, c.email as client_email
     FROM recurring_invoices r
     LEFT JOIN clients c ON r.client_id = c.id
     WHERE r.is_active = TRUE
       AND r.next_invoice_date <= CURRENT_DATE
       AND (r.end_date IS NULL OR r.end_date >= CURRENT_DATE)`
  );
  
  for (const recurring of result.rows) {
    try {
      // Create new invoice
      const invoiceResult = await pool.query(
        `INSERT INTO documents 
         (user_id, client_id, company_id, type, document_number, items, subtotal, tax_rate, tax_amount, total, currency, notes, terms, status)
         VALUES ($1, $2, $3, 'invoice', $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
         RETURNING *`,
        [
          recurring.user_id,
          recurring.client_id,
          recurring.company_id,
          `INV-${Date.now()}`, // Generate unique number
          recurring.items,
          recurring.subtotal,
          recurring.tax_rate,
          recurring.tax_amount,
          recurring.total,
          recurring.currency,
          recurring.notes,
          recurring.terms
        ]
      );
      
      console.log(`✅ Created recurring invoice: ${invoiceResult.rows[0].document_number}`);
      
      // Send email if auto_send is enabled
      if (recurring.auto_send && recurring.client_email) {
        // TODO: Send email with PDF
        console.log(`📧 Sending invoice to: ${recurring.client_email}`);
      }
      
      // Calculate next invoice date
      const nextDate = calculateNextDate(recurring.next_invoice_date, recurring.frequency, recurring.interval);
      
      // Update next_invoice_date
      await pool.query(
        'UPDATE recurring_invoices SET next_invoice_date = $1 WHERE id = $2',
        [nextDate, recurring.id]
      );
      
    } catch (error) {
      console.error(`❌ Error generating recurring invoice ${recurring.id}:`, error);
    }
  }
  
  console.log('✅ Recurring invoices check complete');
}

function calculateNextDate(currentDate: Date, frequency: string, interval: number = 1): Date {
  const next = new Date(currentDate);
  
  switch(frequency) {
    case 'daily':
      next.setDate(next.getDate() + interval);
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 * interval));
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + interval);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + interval);
      break;
  }
  
  return next;
}

// Run every day at midnight
export function scheduleRecurringInvoices() {
  const CronJob = require('cron').CronJob;
  
  const job = new CronJob('0 0 * * *', generateRecurringInvoices);
  job.start();
  
  console.log('✅ Recurring invoices cron job scheduled');
}
```

**3. Add to `backend/src/server.ts`:**
```typescript
import { scheduleRecurringInvoices } from './jobs/generateRecurringInvoices';

// After all routes
scheduleRecurringInvoices();
```

### **Mobile App Implementation:**

**Create `mobile/src/screens/RecurringInvoicesScreen.tsx`:**
```typescript
// Full screen with:
// - List of recurring invoices
// - Create new recurring invoice
// - Edit/pause/delete existing ones
// - Preview next invoice date
```

---

## 📋 **Implementation Checklist**

### **This Weekend:**

**Saturday Morning (2 hours):**
- [x] WhatsApp integration - ALREADY DONE!
- [ ] QR Code payment (1 hour)
  - Install libraries
  - Create QR component
  - Add to DocumentView
  - Add to PDF

**Saturday Afternoon (3 hours):**
- [ ] PDF Templates (3 hours)
  - Create template selection UI
  - Build Classic template
  - Build Minimal template
  - Update PDF generator

**Sunday (3 hours):**
- [ ] Recurring Invoices (3 hours)
  - Database migration
  - Backend API routes
  - Cron job setup
  - Mobile UI (basic version)

---

## 🎯 **Expected Results**

After this weekend, your app will have:
1. ✅ WhatsApp sharing (DONE)
2. ✅ QR code payments
3. ✅ 3 PDF templates (Modern, Classic, Minimal)
4. ✅ Recurring invoices

**Market Position:** Top 1% of invoice apps globally!

---

## 💡 **Quick Start Commands**

```bash
# QR Codes
cd mobile
npx expo install react-native-qrcode-svg react-native-svg

# Recurring Invoices
cd backend
npm install node-cron
psql -U postgres -d quotation_maker -f migrations/add_recurring_invoices.sql

# Done!
```

---

Want me to implement any of these features right now? Just tell me which one to start with! 🚀
