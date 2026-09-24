import { config } from "dotenv";

config();

export const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
};

export default googleConfig;
