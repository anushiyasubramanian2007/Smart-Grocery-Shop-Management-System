import nodemailer from 'nodemailer';

let cachedTransporter = null;

/**
 * Creates and returns an active email transporter
 */
async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  // 1. Production / Custom SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    return cachedTransporter;
  }

  // 2. Gmail service if credentials provided
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    return cachedTransporter;
  }

  // 3. Fallback: Create test Ethereal account
  try {
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    console.log('[EmailService] Created Ethereal Test Transporter:', testAccount.user);
    return cachedTransporter;
  } catch (err) {
    console.warn('[EmailService] Failed to create test transporter, using direct log transporter:', err.message);
    return null;
  }
}

/**
 * Sends a 6-digit Google verification code email
 * @param {string} to - Recipient email address
 * @param {string} code - 6-digit OTP
 * @returns {Promise<{success: boolean, previewUrl?: string, message: string}>}
 */
export async function sendVerificationEmail(to, code) {
  const cleanEmail = to.trim().toLowerCase();
  const subject = `Your Smart Grocery Verification Code: ${code}`;

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #2563eb, #10b981); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Smart Grocery Store</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Google Email ID Verification</p>
      </div>
      
      <div style="padding: 28px 24px; text-align: center;">
        <p style="font-size: 15px; color: #334155; margin-bottom: 20px;">
          Hello, please use the following 6-digit verification code to verify your Google Email address and sign in as Store Owner:
        </p>
        
        <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 16px 36px; margin: 10px 0 24px 0;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #15803d; font-family: monospace;">
            ${code}
          </span>
        </div>
        
        <p style="font-size: 13px; color: #64748b; margin-bottom: 20px;">
          This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11.5px; color: #94a3b8;">
          Sent to <strong>${cleanEmail}</strong> for Smart Grocery Shop Management System.
        </div>
      </div>
    </div>
  `;

  try {
    const transporter = await getTransporter();

    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Smart Grocery Store" <auth@smartgrocery.app>',
        to: cleanEmail,
        subject,
        text: `Your 6-digit verification code is: ${code}. It expires in 10 minutes.`,
        html: htmlContent
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[EmailService] Verification email sent to ${cleanEmail}. MessageId: ${info.messageId}`);
      if (previewUrl) {
        console.log(`[EmailService] Ethereal Email Preview URL: ${previewUrl}`);
      }

      return {
        success: true,
        previewUrl: previewUrl || null,
        message: `Verification code successfully sent to ${cleanEmail}`
      };
    }

    console.log(`[EmailService LOG] Code for ${cleanEmail} is: ${code}`);
    return {
      success: true,
      previewUrl: null,
      message: `Verification code generated for ${cleanEmail}`
    };
  } catch (err) {
    console.error('[EmailService] Error sending email:', err.message);
    // Don't crash the request if mail delivery fails; the in-memory OTP and demo OTP remain valid
    return {
      success: false,
      error: err.message,
      message: `Could not reach SMTP server, but your verification code is ready.`
    };
  }
}

export default { sendVerificationEmail };
