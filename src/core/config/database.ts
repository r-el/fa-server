import dotenv from "dotenv";
dotenv.config();

// Supabase Configuration
export const supabaseConfig = {
  url: process.env.SUPABASE_URL || "",
  key: process.env.SUPABASE_KEY || "",
};

export const qdrantConfig = {
  url: (process.env.QDRANT_URL || "http://127.0.0.1:6333").replace(/\/$/, ""),
};
