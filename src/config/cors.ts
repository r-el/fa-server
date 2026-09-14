import { env } from "./env.js";

export const corsConfig = {
  origin: env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

export default corsConfig;