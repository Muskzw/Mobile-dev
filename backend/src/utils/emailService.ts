import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

export async function sendDocumentEmail(
  to: string,
  subject: string,
  documentNumber: string,
  pdfBuffer: Buffer,
  companyName: string
) {
  try {
    await transporter.sendMail({
      from: `"${companyName}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${subject}</h2>
          <p>Dear Client,</p>
          <p>Please find attached your ${documentNumber}.</p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>${companyName}</p>
        </div>
      `,
      attachments: [
        {
          filename: `${documentNumber}.pdf`,
          content: pdfBuffer
        }
      ]
    });
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
}

