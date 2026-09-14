import "reflect-metadata";
import logger from "@core/utils/logger.js";
/**
 * 1. Connecting to dbs
 * 2. Starts the server
 */
import { connectMongoDB, closeMongoDB } from "@core/db/mongodb.js";
import { testSupabaseConnection } from "@core/db/supabase.js";
import { serverConfig } from "@core/config/server.js";
import app from "./server.js";

const HOST = serverConfig.host as string;
const PORT = serverConfig.port as unknown as number;

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  logger.info(`✔ ${signal} received, shutting down gracefully...`);
  await closeMongoDB();
  process.exit(0);
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server after init dbs
async function startServer() {
  try {
    logger.info("Starting Face Alert Server...");

    // Try to connect to MongoDB, but don't fail if it's not available
    logger.info("Attempting to connect to MongoDB...");
    try {
      await connectMongoDB();
      logger.info("✔ MongoDB connected successfully");
    } catch (error) {
      logger.info("⚠ MongoDB connection failed, continuing with mock data fallback");
      logger.info("MongoDB error:", error.message);
    }

    // Test Supabase connection
    logger.info("Testing Supabase connection...");
    try {
      await testSupabaseConnection();
      logger.info("✔ Supabase connected successfully");
    } catch (error) {
      logger.info("⚠ Supabase connection failed");
      logger.info("Supabase error:", error.message);
    }

    app.listen(PORT, HOST, () => {
      logger.info(`✔ FaceAlert server running on http://${HOST}:${PORT}`);
      logger.info(`✔ Environment: ${serverConfig.environment}`);
      logger.info("✔ Server started - databases will connect on demand");
    });
  } catch (error) {
    logger.error("✘ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
