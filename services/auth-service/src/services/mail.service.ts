import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

class MailService {
  private transporter: Transporter | null = null;
  private isInitialized = false;

  constructor() {
    this.initTransporter();
  }

  private initTransporter(): void {
    try {
      const { host, port, user, password, secure } = config.smtp;

      if (!host || !user) {
        console.warn('[MailService] SMTP credentials not fully configured. Email sending will be logged to console in mock mode.');
        return;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass: password,
        },
      });

      this.isInitialized = true;
    } catch (err) {
      console.error('[MailService] Failed to initialize nodemailer transporter:', err);
    }
  }

  /**
   * Send Welcome Email on user registration (non-blocking)
   */
  public async sendRegistrationEmail(toEmail: string, userName: string): Promise<void> {
    const subject = 'Welcome to Event OS!';
    const textContent = `Welcome to Event OS!

Hi ${userName},

Your Event OS account has been successfully created.

Email: ${toEmail}

You can now log in to Event OS to browse events, join teams, and manage your tickets.

Best regards,
The Event OS Team`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Welcome to Event OS!</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Your Event OS account has been successfully created.</p>
        <div style="background-color: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Registered Email:</strong> ${toEmail}</p>
        </div>
        <p>You can now log in to Event OS to browse upcoming events, book tickets, collaborate with teams, and view announcements.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">This is an automated notification from Event OS.</p>
      </div>
    `;

    await this.sendMailSafe(toEmail, subject, textContent, htmlContent);
  }

  /**
   * Send Login Notification Email on user login (non-blocking)
   */
  public async sendLoginAlertEmail(toEmail: string, userName: string, ipAddress?: string): Promise<void> {
    const subject = 'New Login Detected - Event OS';
    const textContent = `New Login Detected

Hi ${userName},

Someone successfully logged into your Event OS account (${toEmail}).
Time: ${new Date().toUTCString()}
${ipAddress ? `IP Address: ${ipAddress}\n` : ''}
If this was you, no action is required.
If you don't recognize this activity, please secure your account immediately.

Best regards,
The Event OS Team`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #ea580c;">New Login Detected</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>Someone successfully logged into your Event OS account (<strong>${toEmail}</strong>).</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Timestamp:</strong> ${new Date().toUTCString()}</p>
          ${ipAddress ? `<p style="margin: 4px 0 0 0;"><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
        </div>
        <p>If this was you, no action is required.</p>
        <p style="color: #dc2626;"><strong>If you don't recognize this activity, please change your password immediately.</strong></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #6b7280; font-size: 12px;">This is a security alert from Event OS.</p>
      </div>
    `;

    await this.sendMailSafe(toEmail, subject, textContent, htmlContent);
  }

  private async sendMailSafe(to: string, subject: string, text: string, html: string): Promise<void> {
    try {
      if (!this.isInitialized || !this.transporter) {
        console.log(`[MailService:MOCK] Sending email to: ${to} | Subject: "${subject}"`);
        return;
      }

      await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        text,
        html,
      });

      console.log(`[MailService] Successfully sent email to ${to} ("${subject}")`);
    } catch (error) {
      // Non-blocking: log error without breaking auth flow
      console.error(`[MailService] Failed to send email to ${to}:`, error instanceof Error ? error.message : error);
    }
  }
}

export const mailService = new MailService();
