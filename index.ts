/**
 * 1. Connecting to dbs
 * 2. Starts the server
 */
import "reflect-metadata";
import { closeMongoDB, connectMongoDB } from "@core/db/mongodb.js";
import { testSupabaseConnection } from "@core/db/supabase.js";
import { serverConfig } from "@core/config/server.js";
import app from "./src/server.js";
import logger from "@core/utils/logger.js";
import { errorMessage } from "@core/utils/errorMessage.js";

const HOST = serverConfig.host;
const PORT = Number(serverConfig.port);

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`✔ ${signal} received, shutting down gracefully...`);
  await closeMongoDB();
  process.exit(0);
}

// Handle shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server after init dbs
async function startServer(): Promise<void> {
  try {
    logger.info("Starting Face Alert Server");

    // Try to connect to MongoDB, but don't fail if it's not available
    console.log("Attempting to connect to MongoDB...");
    try {
      await connectMongoDB();
      console.log("✔ MongoDB connected successfully");
    } catch (error) {
      console.log("⚠ MongoDB connection failed, continuing with mock data fallback");
      logger.error("MongoDB connection failed", { error: errorMessage(error) });
    }

    // Test Supabase connection
    console.log("Testing Supabase connection...");
    try {
      const isConnected = await testSupabaseConnection();
      if (isConnected) {
        console.log("✔ Supabase connected successfully");
      } else {
        throw new Error("Supabase connection check returned false");
      }
    } catch (error) {
      console.log("⚠ Supabase connection failed");
      logger.error("Supabase connection failed", { error: errorMessage(error) });
    }

    app.listen(PORT, HOST, () => {
      logger.info("FaceAlert server started", { host: HOST, port: PORT, environment: serverConfig.environment });
    });
  } catch (error) {
    logger.error("Failed to start server", { error: errorMessage(error) });
    process.exit(1);
  }
}

startServer();