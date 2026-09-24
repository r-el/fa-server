import { config } from "dotenv";

config();

export const emailConfig = {
  sendgridApiKey: process.env.SENDGRID_API_KEY || "",
  senderEmail: process.env.EMAIL_SENDER || "no-reply@facealert.com",
  senderName: process.env.EMAIL_SENDER_NAME || "FaceAlert System",
};

export default emailConfig;
