import PDFDocument from 'pdfkit';

export async function generatePDF(document: any, company: any, client: any | null): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
    doc.on('error', reject);

    // Header with company logo
    if (company.logo_url) {
      // In production, you'd load the actual image file
      doc.fontSize(20).text(company.name || 'Company', 50, 50);
    } else {
      doc.fontSize(20).text(company.name || 'Company', 50, 50);
    }

    // Company details
    doc.fontSize(10)
       .text(company.address || '', 50, 80)
       .text(`Phone: ${company.phone || ''}`, 50, 95)
       .text(`Email: ${company.email || ''}`, 50, 110);

    // Document type and number
    const docType = document.type.charAt(0).toUpperCase() + document.type.slice(1).replace('_', ' ');
    doc.fontSize(18)
       .text(docType, 400, 50)
       .fontSize(12)
       .text(`Number: ${document.document_number}`, 400, 75)
       .text(`Date: ${new Date(document.issue_date).toLocaleDateString()}`, 400, 90);

    if (document.due_date) {
      doc.text(`Due Date: ${new Date(document.due_date).toLocaleDateString()}`, 400, 105);
    }

    // Client details
    if (client) {
      doc.fontSize(12)
         .text('Bill To:', 50, 150)
         .fontSize(10)
         .text(client.name || '', 50, 170)
         .text(client.address || '', 50, 185)
         .text(`Email: ${client.email || ''}`, 50, 200)
         .text(`Phone: ${client.phone || ''}`, 50, 215);
    }

    // Items table
    let yPos = 250;
    doc.fontSize(12).text('Items', 50, yPos);
    yPos += 20;

    // Table header
    doc.fontSize(10)
       .text('Description', 50, yPos)
       .text('Qty', 300, yPos)
       .text('Price', 350, yPos)
       .text('Total', 450, yPos);
    
    yPos += 15;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();

    // Items
    document.items.forEach((item: any) => {
      yPos += 15;
      doc.fontSize(9)
         .text(item.name || '', 50, yPos, { width: 240 })
         .text(item.quantity.toString(), 300, yPos)
         .text(`${document.currency} ${parseFloat(item.unit_price).toFixed(2)}`, 350, yPos)
         .text(`${document.currency} ${parseFloat(item.total).toFixed(2)}`, 450, yPos);
      
      if (item.description) {
        yPos += 10;
        doc.fontSize(8).text(item.description, 50, yPos, { width: 240 });
      }
    });

    yPos += 20;
    doc.moveTo(50, yPos).lineTo(550, yPos).stroke();

    // Totals
    yPos += 20;
    doc.fontSize(10)
       .text('Subtotal:', 400, yPos)
       .text(`${document.currency} ${parseFloat(document.subtotal).toFixed(2)}`, 450, yPos);

    if (parseFloat(document.tax_rate) > 0) {
      yPos += 15;
      doc.text(`Tax (${document.tax_rate}%):`, 400, yPos)
         .text(`${document.currency} ${parseFloat(document.tax_amount).toFixed(2)}`, 450, yPos);
    }

    yPos += 15;
    doc.fontSize(12)
       .text('Total:', 400, yPos)
       .text(`${document.currency} ${parseFloat(document.total).toFixed(2)}`, 450, yPos);

    // Notes and terms
    if (document.notes) {
      yPos += 40;
      doc.fontSize(10)
         .text('Notes:', 50, yPos)
         .fontSize(9)
         .text(document.notes, 50, yPos + 15, { width: 500 });
    }

    if (document.terms) {
      yPos += 60;
      doc.fontSize(10)
         .text('Terms & Conditions:', 50, yPos)
         .fontSize(9)
         .text(document.terms, 50, yPos + 15, { width: 500 });
    }

    doc.end();
  });
}

