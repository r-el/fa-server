import { z } from "zod";

const OWNER_ID_PATTERN = /^[a-z0-9_]+$/;

const specterEnvironmentSchema = z.object({
  SPECTER_API_URL: z.string().url().default("http://127.0.0.1:8000"),
  // In Docker the Compose secret; from source, Specter's .dev/secrets/api.token.
  SPECTER_API_TOKEN_FILE: z.string().min(1).default("/run/secrets/specter_api_token"),
  SPECTER_NATS_URL: z.string().min(1).default("nats://127.0.0.1:4222"),
  SPECTER_OWNER_ID: z.string().regex(OWNER_ID_PATTERN).default("facealert"),
  SPECTER_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

export interface SpecterConfig {
  apiUrl: string;
  apiTokenFile: string;
  natsUrl: string;
  ownerId: string;
  requestTimeoutMs: number;
}

export function loadSpecterConfig(environment: NodeJS.ProcessEnv = process.env): SpecterConfig {
  const values = specterEnvironmentSchema.parse(environment);
  return {
    apiUrl: values.SPECTER_API_URL.replace(/\/$/, ""),
    apiTokenFile: values.SPECTER_API_TOKEN_FILE,
    natsUrl: values.SPECTER_NATS_URL,
    ownerId: values.SPECTER_OWNER_ID,
    requestTimeoutMs: values.SPECTER_REQUEST_TIMEOUT_MS,
  };
}
