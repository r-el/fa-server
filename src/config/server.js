import { env } from "./env.js";

export const serverConfig = {
  port: env.PORT,
  host: env.NODE_ENV === "production" ? "0.0.0.0" : env.HOST,
  environment: env.NODE_ENV,
};

export default serverConfig;
