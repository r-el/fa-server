import { config } from "dotenv";

config();

export const testmailConfig = {
  apiKey: process.env.TESTMAIL_API_KEY || "",
  namespace: process.env.TESTMAIL_NAMESPACE || "",
};

export default testmailConfig;
