import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    HOST: z.string().default("localhost"),
    ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),
    MONGODB_URI: z.string().optional(),
    MONGODB_DB_NAME: z.string().min(1).default("face_identity"),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_KEY: z.string().min(1).optional(),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(31).default(10),
    JWT_SECRET: z.string().optional(),
    JWT_EXPIRES_IN: z.string().default("7d"),
  })
  .superRefine((values, context) => {
    if (values.NODE_ENV !== "production") return;

    if (!values.MONGODB_URI) {
      context.addIssue({ code: "custom", path: ["MONGODB_URI"], message: "is required in production" });
    }
    if (!values.SUPABASE_URL) {
      context.addIssue({ code: "custom", path: ["SUPABASE_URL"], message: "is required in production" });
    }
    if (!values.SUPABASE_KEY) {
      context.addIssue({ code: "custom", path: ["SUPABASE_KEY"], message: "is required in production" });
    }
    if (!values.JWT_SECRET || values.JWT_SECRET.length < 32 || values.JWT_SECRET === "your-jwt-secret-key-here") {
      context.addIssue({ code: "custom", path: ["JWT_SECRET"], message: "must be a strong secret in production" });
    }
  });

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment configuration: ${details}`);
}

export const env = parsedEnv.data;