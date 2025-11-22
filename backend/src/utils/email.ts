/**
 * Email Service Utility using Resend
 * 
 * Setup Instructions:
 * 1. Sign up at https://resend.com/ (no 2FA required!)
 * 2. Get your API key from the dashboard
 * 3. Add to .env: RESEND_API_KEY=your_api_key_here
 * 4. Add to .env: EMAIL_FROM=onboarding@resend.dev (or your verified domain)
 * 5. Install: npm install resend ✅ DONE
 * 6. Uncomment the code below ✅ DONE
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY not set. Email would be sent to:', email);
    console.log('Reset token:', resetToken);
    return;
  }

  const resetLink = `yourapp://reset-password?token=${resetToken}`;

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Quotation App <onboarding@resend.dev>',
      to: [email],
      subject: 'Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6; 
                color: #333; 
                margin: 0;
                padding: 0;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                padding: 40px 30px; 
                text-align: center; 
                border-radius: 12px 12px 0 0; 
              }
              .header h1 { 
                color: white; 
                margin: 0; 
                font-size: 28px; 
                font-weight: 600;
              }
              .content { 
                background: #ffffff; 
                padding: 40px 30px; 
                border: 1px solid #e5e7eb; 
                border-top: none;
                border-radius: 0 0 12px 12px;
              }
              .button { 
                display: inline-block; 
                background: #4F46E5; 
                color: white !important; 
                padding: 16px 32px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 24px 0; 
                font-weight: 600;
                font-size: 16px;
              }
              .button:hover { 
                background: #4338CA; 
              }
              .footer { 
                color: #6B7280; 
                font-size: 14px; 
                margin-top: 30px; 
                padding-top: 20px; 
                border-top: 1px solid #e5e7eb; 
              }
              .warning { 
                background: #FEF3C7; 
                border-left: 4px solid #F59E0B; 
                padding: 16px; 
                margin: 24px 0; 
                border-radius: 6px; 
              }
              code {
                background: #f3f4f6;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 13px;
                word-break: break-all;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Reset Your Password</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px; margin-bottom: 10px;">Hi ${name},</p>
                <p style="font-size: 15px; color: #4B5563; margin-bottom: 24px;">
                  We received a request to reset your password. Click the button below to choose a new password:
                </p>
                
                <div style="text-align: center;">
                  <a href="${resetLink}" class="button">Reset Password</a>
                </div>
                
                <p style="color: #6B7280; font-size: 14px; margin-top: 24px;">
                  Or copy and paste this link into your browser:<br>
                  <code>${resetLink}</code>
                </p>
                
                <div class="warning">
                  <strong style="color: #92400E;">⏰ This link expires in 1 hour</strong>
                </div>
                
                <div class="footer">
                  <p style="margin-bottom: 8px;"><strong>Didn't request this?</strong></p>
                  <p style="margin: 0; line-height: 1.5;">
                    If you didn't ask to reset your password, you can safely ignore this email. 
                    Your password will remain unchanged.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Hi ${name},

We received a request to reset your password.

Click this link to reset your password:
${resetLink}

This link expires in 1 hour.

If you didn't request this, you can safely ignore this email.

-- 
Quotation App Team
      `.trim()
    });

    if (data.error) {
      throw new Error(`Failed to send email: ${data.error.message}`);
    }

    console.log('✅ Password reset email sent:', data.data?.id);
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log('⚠️  RESEND_API_KEY not set. Welcome email would be sent to:', email);
    return;
  }

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Quotation App <onboarding@resend.dev>',
      to: [email],
      subject: '🎉 Welcome to Quotation App!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6; 
                color: #333;
                margin: 0;
                padding: 0;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                padding: 40px 30px; 
                text-align: center; 
                border-radius: 12px; 
                margin-bottom: 30px;
              }
              .header h1 { 
                color: white; 
                margin: 0; 
                font-size: 32px;
              }
              .content { 
                padding: 0 10px; 
              }
              .feature { 
                margin: 20px 0; 
                padding: 20px; 
                background: #f9fafb; 
                border-radius: 8px; 
                border-left: 4px solid #667eea;
              }
              .feature ul {
                margin: 10px 0;
                padding-left: 20px;
              }
              .feature li {
                margin: 8px 0;
                color: #4B5563;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Welcome!</h1>
              </div>
              <div class="content">
                <p style="font-size: 16px;">Hi ${name},</p>
                <p style="font-size: 15px; color: #4B5563;">
                  Thanks for joining! You're all set to create professional invoices and quotations.
                </p>
                
                <div class="feature">
                  <strong style="font-size: 16px; color: #1F2937;">✨ Your free trial includes:</strong>
                  <ul>
                    <li>Unlimited documents</li>
                    <li>Professional PDF templates</li>
                    <li>Client & product management</li>
                    <li>Dark mode support</li>
                    <li>30 days free access</li>
                  </ul>
                </div>
                
                <p style="color: #4B5563;">
                  Need help getting started? Check out our Help Center in the app settings.
                </p>
                
                <p style="margin-top: 30px; color: #4B5563;">
                  Happy invoicing! 🚀
                </p>
                
                <p style="color: #9CA3AF; font-size: 13px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                  Quotation App Team
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    if (data.error) {
      throw new Error(`Failed to send email: ${data.error.message}`);
    }

    console.log('✅ Welcome email sent:', data.data?.id);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
  }
}
