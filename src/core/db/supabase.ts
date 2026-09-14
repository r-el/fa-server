import logger from "@core/utils/logger.js";
/**
 * Supabase Connection Module
 * Manages connection to Supabase for users data
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "../config/database.js";

let supabase: SupabaseClient | null = null;

// Validate environment variables - Do not exit process in testing environments
if (!supabaseConfig.url || !supabaseConfig.key) {
  logger.error("✘ Missing Supabase configuration. Please check your env variables.");
  if (process.env.NODE_ENV !== 'test') {
    process.exit(1);
  }
} else {
  // Create Supabase client
  supabase = createClient(supabaseConfig.url, supabaseConfig.key, (supabaseConfig as any).options);
}

async function testSupabaseConnection() {
  if (!supabase) return false;
  try {
    // Simple query to test connection
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (error && error.code !== "PGRST116") {
      // PGRST116 means table doesn't exist yet, which is OK
      throw error;
    }

    logger.info("✔ Supabase connection successful");
    return true;
  } catch (error: any) {
    logger.error("✘ Supabase connection error:", error.message);
    return false;
  }
}

function getSupabaseClient() {
  return supabase;
}

export { supabase, testSupabaseConnection, getSupabaseClient };
