import nodemailer, { Transporter } from 'nodemailer';

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass && !user.includes('your_') && !pass.includes('your_')) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      this.isConfigured = true;
      console.log(`[EmailService] Nodemailer initialized with SMTP host: ${host}`);
    } else {
      this.isConfigured = false;
    }
  }

  /**
   * Dispatches a 6-digit registration / verification OTP via email.
   */
  public async sendOtpEmail(toEmail: string, otpCode: string): Promise<{ success: boolean; simulated?: boolean }> {
    const cleanEmail = toEmail.toLowerCase().trim();
    const subject = `🔐 Electronics Lab: Your Verification Code`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Code - Open-World Electronics Lab</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
              <div style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">
                CircuitVerse • CAD & 3D Simulation
              </div>
              <div style="font-size: 20px; font-weight: 700; color: #ffffff;">
                Open-World Electronics Lab
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 12px 0;">
                Verify Your Email Address
              </h2>
              <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 24px 0;">
                Use the 6-digit verification code below to complete your registration and synchronize your engineering schematics.
              </p>

              <!-- OTP Code Box -->
              <div style="background-color: #f8fafc; border: 2px dashed #93c5fd; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  Your One-Time Password
                </div>
                <div style="font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #2563eb;">
                  ${otpCode}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                  Expires in <strong>5 minutes</strong>
                </div>
              </div>

              <p style="font-size: 13px; line-height: 20px; color: #64748b; margin: 0 0 16px 0;">
                If you did not request this verification code, please ignore this email. Someone may have entered your email address by mistake.
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <div style="font-size: 11px; color: #94a3b8; line-height: 18px;">
                Open-World Electronics Lab • Educational Engineering Platform<br />
                Do not reply directly to this automated email.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (!this.isConfigured || !this.transporter) {
      console.log(`\n========================================================================`);
      console.log(`✉️ [EMAIL DISPATCH - DEV SIMULATION MODE]`);
      console.log(`To: ${cleanEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`OTP Code: ${otpCode}`);
      console.log(`Expires: 5 minutes`);
      console.log(`ℹ️ Notice: Set valid SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env for real SMTP dispatch.`);
      console.log(`========================================================================\n`);

      return { success: true, simulated: true };
    }

    try {
      const fromAddress = process.env.SMTP_FROM || `"Open-World Electronics Lab" <${process.env.SMTP_USER}>`;
      await this.transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject,
        html: htmlContent,
        text: `Your Open-World Electronics Lab verification code is: ${otpCode}. It expires in 5 minutes.`,
      });

      console.log(`[EmailService] OTP email dispatched successfully to ${cleanEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[EmailService] Failed to send email to ${cleanEmail}:`, err.message);
      // Fallback log so local dev never breaks
      console.log(`[FALLBACK EMAIL OTP for ${cleanEmail}]: ${otpCode}`);
      return { success: true, simulated: true };
    }
  }

  /**
   * Dispatches a password setup / reset link via email.
   */
  public async sendPasswordSetupEmail(toEmail: string, token: string): Promise<{ success: boolean; simulated?: boolean }> {
    const cleanEmail = toEmail.toLowerCase().trim();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8085';
    const setupUrl = `${frontendUrl}/#setup-password?token=${token}`;
    const subject = `🔑 Electronics Lab: Set Up Your Account Password`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Setup - Open-World Electronics Lab</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
              <div style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 4px;">
                CircuitVerse • CAD & 3D Simulation
              </div>
              <div style="font-size: 20px; font-weight: 700; color: #ffffff;">
                Open-World Electronics Lab
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 18px; font-weight: 600; color: #0f172a; margin: 0 0 12px 0;">
                Password Setup & Recovery
              </h2>
              <p style="font-size: 14px; line-height: 22px; color: #475569; margin: 0 0 24px 0;">
                We received a request to set up or reset your password for your Electronics Lab account (<strong>${cleanEmail}</strong>). Click the button below to configure your new secure password:
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${setupUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                  Set Up My Password →
                </a>
              </div>

              <p style="font-size: 12px; color: #64748b; line-height: 18px; margin: 0 0 16px 0;">
                This link will securely expire in <strong>15 minutes</strong>. If you did not request this link, no changes have been made to your account.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 16px;">
                <div style="font-size: 11px; color: #64748b; margin-bottom: 4px;">Or copy and paste this URL into your browser:</div>
                <div style="font-family: monospace; font-size: 11px; color: #2563eb; word-break: break-all;">
                  ${setupUrl}
                </div>
              </div>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <div style="font-size: 11px; color: #94a3b8; line-height: 18px;">
                Open-World Electronics Lab • Educational Engineering Platform<br />
                Do not reply directly to this automated email.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    if (!this.isConfigured || !this.transporter) {
      console.log(`\n========================================================================`);
      console.log(`✉️ [EMAIL DISPATCH - DEV SIMULATION MODE] (Password Setup)`);
      console.log(`To: ${cleanEmail}`);
      console.log(`Subject: ${subject}`);
      console.log(`Setup URL: ${setupUrl}`);
      console.log(`Token: ${token}`);
      console.log(`Expires: 15 minutes`);
      console.log(`ℹ️ Notice: Set valid SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env for real SMTP dispatch.`);
      console.log(`========================================================================\n`);

      return { success: true, simulated: true };
    }

    try {
      const fromAddress = process.env.SMTP_FROM || `"Open-World Electronics Lab" <${process.env.SMTP_USER}>`;
      await this.transporter.sendMail({
        from: fromAddress,
        to: cleanEmail,
        subject,
        html: htmlContent,
        text: `Set up your Open-World Electronics Lab password: ${setupUrl}. Valid for 15 minutes.`,
      });

      console.log(`[EmailService] Password setup email dispatched successfully to ${cleanEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error(`[EmailService] Failed to send password setup email to ${cleanEmail}:`, err.message);
      console.log(`[FALLBACK PASSWORD SETUP LINK for ${cleanEmail}]: ${setupUrl}`);
      return { success: true, simulated: true };
    }
  }
}

export const emailService = new EmailService();
