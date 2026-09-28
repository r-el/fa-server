import { config } from "dotenv";

config();

export const emailConfig = {
  sendgridApiKey: process.env.SENDGRID_API_KEY || "",
  senderEmail: process.env.EMAIL_SENDER || "no-reply@specter.com",
  senderName: process.env.EMAIL_SENDER_NAME || "Specter System",
};

export default emailConfig;
