import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    env: {
      NODE_ENV: "test",
      MONGODB_URI: "",
      MONGODB_DB_NAME: "face_identity_test",
      SUPABASE_URL: "http://localhost:54321",
      SUPABASE_KEY: "test-key",
    },
  },
});