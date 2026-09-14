import logger from "@core/utils/logger.js";
/**
 * MongoDB Connection Module
 */
import { MongoClient, GridFSBucket } from "mongodb";
import { mongoConfig } from "../config/database.js";

// Store client, collections and GridFS as private variables
let client;
let eventsCollection;
let photoStorageBucket;
let connectionStatus = "disconnected";

// Connection options with pooling
const connectionOptions = (mongoConfig.options as any);

/**
 * Creates connection to MongoDB with retry logic
 * @returns {Promise} - Promise that resolves when connection is established
 */
async function connectMongoDB(maxRetries = 3, retryDelay = 2000) {
  let retries = 0;

  // Check if MongoDB URI is configured
  if (!mongoConfig.uri) {
    logger.info("⚠ MongoDB URI not configured - skipping MongoDB connection");
    connectionStatus = "not_configured";
    return null;
  }

  while (retries < maxRetries) {
    try {
      logger.info(`Attempting MongoDB connection... (attempt ${retries + 1}/${maxRetries})`);

      client = await MongoClient.connect(mongoConfig.uri, connectionOptions);

      // Access database and collection
      const db = client.db(mongoConfig.dbName);
      eventsCollection = db.collection("Event");

      // Initialize GridFS bucket for photo storage
      photoStorageBucket = new GridFSBucket(db, { bucketName: "photo_storage" });      logger.info("✔ MongoDB connection established successfully");
      logger.info(
        `✔ Connection pool configured: min=${connectionOptions.minPoolSize}, max=${connectionOptions.maxPoolSize}`
      );
      connectionStatus = "connected";
      return client;
    } catch (error) {
      retries++;
      connectionStatus = "error";
      logger.error(`✘ MongoDB connection attempt ${retries} failed:`, error.message);

      if (retries < maxRetries) {
        logger.info(`Retrying in ${retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay *= 2; // Exponential backoff
      } else {
        logger.error("✘ All MongoDB connection attempts failed");
        logger.info("⚠ Server will continue without MongoDB - using fallback data");
        connectionStatus = "failed";
        return null; // Return null instead of throwing
      }
    }
  }
}

/**
 * Returns access to events collection
 * @returns {Collection} - MongoDB collection object
 */
function getEventsCollection() {
  if (!eventsCollection) {
    logger.info("⚠ MongoDB not connected - events collection unavailable");
    return null;
  }
  return eventsCollection;
}

/**
 * Returns access to photo storage GridFS bucket
 * @returns {GridFSBucket} - GridFS bucket object
 */
function getPhotoStorageBucket() {
  if (!photoStorageBucket) {
    logger.info("⚠ MongoDB not connected - photo storage unavailable");
    return null;
  }
  return photoStorageBucket;
}

/**
 * Get current MongoDB connection status
 */
function getMongoDBStatus() {
  return connectionStatus;
}

/**
 * Check if MongoDB is available
 */
function isMongoDBAvailable() {
  return connectionStatus === "connected";
}

/**
 * Closes MongoDB connection
 */
async function closeMongoDB() {
  if (client) {
    await client.close();
    connectionStatus = "disconnected";
    logger.info("MongoDB connection closed");
  }
}

export { connectMongoDB, getEventsCollection, getPhotoStorageBucket, getMongoDBStatus, isMongoDBAvailable, closeMongoDB };
