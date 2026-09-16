/**
 * Email Service
 *
 * Wraps @sendgrid/mail to send emails.
 * Abstracts the third-party dependency so the rest of the application
 * only deals with our internal methods like sendWelcomeEmail.
 */

import { injectable } from "tsyringe";
import sgMail from "@sendgrid/mail";
import { emailConfig } from "@core/config/email.js";
import logger from "@core/utils/logger.js";

// Initialize SendGrid if API key is provided
if (emailConfig.sendgridApiKey) {
  sgMail.setApiKey(emailConfig.sendgridApiKey);
}

@injectable()
export class EmailService {
  /**
   * Send a general email.
   * Prefer using the specific helper methods below instead of this one directly.
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<boolean> {
    if (!emailConfig.sendgridApiKey) {
      logger.warn("SendGrid API key not configured, skipping email send", {
        to: options.to,
        subject: options.subject,
      });
      return false; // Silently fail in development if no key
    }

    try {
      await sgMail.send({
        to: options.to,
        from: {
          email: emailConfig.senderEmail,
          name: emailConfig.senderName,
        },
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      logger.info("Email sent successfully", { to: options.to, subject: options.subject });
      return true;
    } catch (error) {
      logger.error("Failed to send email", {
        error: error instanceof Error ? error.message : "unknown",
        to: options.to,
      });
      return false;
    }
  }

  /**
   * Sends a welcome / verification email to a newly registered user.
   */
  async sendWelcomeEmail(toEmail: string, name: string): Promise<boolean> {
    const subject = "Welcome to FaceAlert - Verify your email";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to FaceAlert, ${name}!</h2>
        <p>Thank you for registering with FaceAlert.</p>
        <p>Your account has been successfully created. We are excited to have you on board!</p>
        <p>If you need any assistance, feel free to reach out to our support team.</p>
        <br>
        <p>Best regards,<br>The FaceAlert Team</p>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject,
      html,
    });
  }

  /**
   * (Placeholder) Sends a security alert email.
   */
  async sendSecurityAlert(toEmail: string, cameraName: string, details: string): Promise<boolean> {
    const subject = `FaceAlert Security Alert: ${cameraName}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #e53e3e;">Security Alert Triggered</h2>
        <p>An event was detected on camera <strong>${cameraName}</strong>.</p>
        <p><strong>Details:</strong> ${details}</p>
        <p>Please log in to the FaceAlert dashboard to review this alert.</p>
      </div>
    `;

    return this.sendEmail({
      to: toEmail,
      subject,
      html,
    });
  }
}
