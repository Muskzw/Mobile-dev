import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

export async function generatePDF(document: any, company: any, client: any | null, user?: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    // Colors
    const primaryColor = company.brand_color || '#4F46E5';
    const secondaryColor = '#6B7280';
    const lightGray = '#F3F4F6';

    // Logo & Company Name
    if (company.logo_url) {
      const logoPath = path.join(process.cwd(), company.logo_url.startsWith('/') ? company.logo_url.slice(1) : company.logo_url);

      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 50, 40, { width: 70, height: 70 });
        } catch (e) {
          console.error('Error loading logo:', e);
        }
      }
    }

    // Company Details (Left side)
    doc.fillColor('#111827').fontSize(16).font('Helvetica-Bold')
      .text(company.name || 'Company', 130, 50);

    doc.fillColor(secondaryColor).fontSize(9).font('Helvetica')
      .text(company.address || '', 130, 70, { width: 200 })
      .text(company.phone || '', 130, 85)
      .text(company.email || '', 130, 95);

    // Document Type (Right side)
    const docType = document.type.replace('_', ' ');
    const docTypeLabel = docType.charAt(0).toUpperCase() + docType.slice(1);
    doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold')
      .text(docTypeLabel, 400, 50, { align: 'right', width: 150 });

    // Document Number (matches document type)
    const docNumberLabel = docType === 'quotation' ? 'Quotation#' :
      docType === 'invoice' ? 'Invoice#' :
        docType === 'proforma' ? 'Proforma#' : 'Document#';

    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold')
      .text(docNumberLabel, 400, 85, { align: 'right', width: 70 })
      .text('Date:', 400, 100, { align: 'right', width: 70 });

    // Add due date for invoices
    if (document.due_date && (document.type === 'invoice' || document.type === 'proforma')) {
      doc.text('Due Date:', 400, 115, { align: 'right', width: 70 });
    }

    doc.font('Helvetica').fontSize(9)
      .text(document.document_number, 475, 85, { align: 'left', width: 75 })
      .text(new Date(document.issue_date).toLocaleDateString(), 475, 100, { align: 'left', width: 75 });

    if (document.due_date && (document.type === 'invoice' || document.type === 'proforma')) {
      doc.text(new Date(document.due_date).toLocaleDateString(), 475, 115, { align: 'left', width: 75 });
    }

    // Horizontal line separator
    doc.moveTo(50, 125).lineTo(550, 125).stroke();

    // Bill To section
    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold')
      .text('Bill To:', 50, 140);

    if (client) {
      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica')
        .text(client.name || '', 50, 155)
        .text(client.address || '', 50, 168, { width: 250 })
        .text(client.email || '', 50, 181)
        .text(client.phone || '', 50, 194);
    }

    // Items Table
    let y = 230;

    // Table Header
    doc.rect(50, y, 500, 25).fillAndStroke(primaryColor, primaryColor);
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    doc.text('#', 55, y + 8);
    doc.text('DESCRIPTION', 80, y + 8);
    doc.text('QTY', 350, y + 8, { width: 50, align: 'center' });
    doc.text('PRICE', 410, y + 8, { width: 60, align: 'right' });
    doc.text('TOTAL', 480, y + 8, { width: 65, align: 'right' });

    y += 25;

    // Table Rows
    doc.fillColor('#374151').font('Helvetica');
    document.items.forEach((item: any, i: number) => {
      const rowY = y;
      const rowHeight = item.description && item.description !== item.name ? 35 : 25;

      // Alternating row background
      if (i % 2 === 0) {
        doc.rect(50, rowY, 500, rowHeight).fill(lightGray);
      }

      // Item number
      doc.fillColor('#374151').fontSize(9).font('Helvetica')
        .text((i + 1).toString(), 55, rowY + 6);

      // Item name
      doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold')
        .text(item.name || item.description, 80, rowY + 6, { width: 260 });

      // Item description/details (if different from name)
      if (item.description && item.description !== item.name) {
        doc.fillColor(secondaryColor).fontSize(7).font('Helvetica')
          .text(item.description, 80, rowY + 18, { width: 260 });
      }

      // Quantity
      doc.fillColor('#374151').fontSize(9).font('Helvetica')
        .text(item.quantity.toString(), 350, rowY + 8, { width: 50, align: 'center' });

      // Price
      doc.text(parseFloat(item.unit_price).toFixed(2), 410, rowY + 8, { width: 60, align: 'right' });

      // Total
      doc.font('Helvetica-Bold')
        .text(parseFloat(item.total).toFixed(2), 480, rowY + 8, { width: 65, align: 'right' });

      y += rowHeight;
    });

    // Bottom border for table
    doc.moveTo(50, y).lineTo(550, y).strokeColor('#E5E7EB').stroke();

    // Totals Section - FIXED to stay within page margins
    // Page: 612 width, 50 margins each side = content area 50-562
    y += 20;
    const labelX = 380;
    const valueX = 455;

    // Subtotal
    doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold')
      .text('Subtotal:', labelX, y, { width: 70, align: 'right' });
    doc.fillColor('#111827').fontSize(9).font('Helvetica')
      .text(`${document.currency} ${parseFloat(document.subtotal).toFixed(2)}`, valueX, y, { width: 95, align: 'right' });

    // Tax
    if (parseFloat(document.tax_rate || 0) > 0) {
      y += 15;
      doc.fillColor(secondaryColor).fontSize(9).font('Helvetica-Bold')
        .text(`Tax (${document.tax_rate}%):`, labelX, y, { width: 70, align: 'right' });
      doc.fillColor('#111827').fontSize(9).font('Helvetica')
        .text(`${document.currency} ${parseFloat(document.tax_amount).toFixed(2)}`, valueX, y, { width: 95, align: 'right' });
    }

    y += 15;
    // Separator line
    doc.moveTo(370, y).lineTo(550, y).strokeColor('#E5E7EB').stroke();
    y += 10;

    // Total highlight box
    doc.rect(370, y - 5, 180, 25).fillAndStroke(lightGray, '#E5E7EB');
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('Total:', labelX, y + 3, { width: 70, align: 'right' });
    doc.fontSize(11).font('Helvetica-Bold')
      .text(`${document.currency} ${parseFloat(document.total).toFixed(2)}`, valueX, y + 3, { width: 95, align: 'right' });

    // Footer Section
    let footerY = y + 40;

    // Terms & Conditions (if available)
    if (document.terms || company.terms) {
      doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold')
        .text('Terms & Conditions:', 50, footerY);

      const terms = document.terms || company.terms || '';
      doc.fillColor(secondaryColor).fontSize(8).font('Helvetica')
        .text(terms, 50, footerY + 15, { width: 500, lineGap: 2 });

      footerY += 60;
    }

    // Payment Instructions Section
    if (footerY < 650) footerY = 650; // Ensure consistent placement

    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold')
      .text('Payment Instructions:', 50, footerY);

    const paymentInstructions = company.payment_instructions ||
      `Payment accepted via bank transfer, cash, or mobile money.\nPlease include ${docNumberLabel.replace('#', '')} number in payment reference.`;

    doc.fillColor(secondaryColor).fontSize(8).font('Helvetica')
      .text(paymentInstructions, 50, footerY + 15, { width: 250, lineGap: 2 });

    // Authorized Signature Section
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold')
      .text(`For ${company.name || 'Company'}`, 350, footerY);

    // Signature line
    doc.moveTo(350, footerY + 40).lineTo(500, footerY + 40).stroke();

    doc.fillColor(secondaryColor).fontSize(8).font('Helvetica')
      .text('AUTHORIZED SIGNATURE', 350, footerY + 45, { align: 'center', width: 150 });

    // Watermark for free tier users
    const isFreeTier = !user || user.subscription_tier === 'free';
    if (isFreeTier) {
      const watermarkY = 760;

      // Subtle background box
      doc.rect(50, watermarkY - 5, 500, 20)
        .fillAndStroke('#FEF3C7', '#F59E0B');

      // Watermark text
      doc.fillColor('#92400E').fontSize(9).font('Helvetica-Bold')
        .text('📄 Created with Quotation Maker', 180, watermarkY, { continued: true })
        .fillColor('#B45309').fontSize(8).font('Helvetica')
        .text(' - Upgrade to Premium to remove this watermark', { link: 'https://yourapp.com/upgrade' });
    }

    // Page number at bottom
    doc.fillColor('#9CA3AF').fontSize(7).font('Helvetica')
      .text('Page 1 of 1', 50, 780, { align: 'right', width: 500 });

    doc.end();
  });
}
