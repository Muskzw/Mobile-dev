import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument({ margin: 50, size: 'A4' });
doc.pipe(fs.createWriteStream('watermark_test.pdf'));

// Simulate content
doc.fontSize(20).text('Invoice Content', 50, 50);

// WATERMARK LOGIC (Copied from pdfGenerator.ts)
const isFreeTier = true; // Simulate free user
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

doc.end();
console.log('PDF generated with watermark logic.');
