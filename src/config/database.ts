import { env } from "./env.js";

export const mongoConfig = {
  uri: env.MONGODB_URI,
  dbName: env.MONGODB_DB_NAME,
  options: {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
  },
  collections: {
    events: "Event",
    photoStorage: "Photo_storage",
  },
} as const;

export const supabaseConfig = {
  url: env.SUPABASE_URL,
  key: env.SUPABASE_KEY,
  options: {
    auth: {
      persistSession: false,
    },
  },
} as const;