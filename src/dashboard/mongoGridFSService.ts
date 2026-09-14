import logger from "@core/utils/logger.js";
import { MongoClient, GridFSBucket } from "mongodb";
import { mongoConfig } from "@core/config/database.js";
import { isMongoDBAvailable, getMongoDBStatus } from "@core/db/mongodb.js";
import { minioStorageService } from "./minioStorageService.js";

/**
 * Legacy MongoGridFSService
 * Left here to ensure backward compatibility and properly resolve the missing queries
 * that were mistakenly deleted during the refactoring process.
 */
class MongoGridFSService {
  client: MongoClient | null;
  db: any | null;
  bucket: GridFSBucket | null;
  isConnected: boolean;

  constructor() {
    this.client = null;
    this.db = null;
    this.bucket = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        return this.db;
      }
      if (!mongoConfig.uri) {
        throw new Error("MongoDB URI not configured. Please set MONGODB_URI environment variable.");
      }
      if (!isMongoDBAvailable()) {
        const status = getMongoDBStatus();
        throw new Error(`MongoDB not available. Status: ${status}`);
      }

      this.client = new MongoClient(mongoConfig.uri, mongoConfig.options as any);
      await this.client.connect();
      
      this.db = this.client.db(mongoConfig.dbName);
      this.bucket = new GridFSBucket(this.db, { 
        bucketName: mongoConfig.collections.photoStorage 
      });
      
      this.isConnected = true;
      logger.info("Connected to MongoDB GridFS successfully");
      
      return this.db;
    } catch (error) {
      logger.error("Failed to connect to MongoDB GridFS:", error);
      throw error;
    }
  }

  async getImageById(imageId: string) {
    try {
      return await minioStorageService.getImageStream(imageId);
    } catch (error) {
      logger.error("Error getting image from MinIO (fallback from GridFS):", error);
      throw error;
    }
  }

  async getImageAsBase64(imageId: string) {
    try {
      return await minioStorageService.getImageAsBase64(imageId);
    } catch (error) {
      logger.error("Error converting image to base64:", error);
      throw error;
    }
  }

  async getEvents(filters: any = {}) {
    try {
      await this.connect();
      
      const query: any = {};
      
      if (filters.level) {
        query.level = filters.level;
      }
      
      if (filters.startDate || filters.endDate) {
        query.time = {};
        if (filters.startDate) {
          query.time.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.time.$lte = new Date(filters.endDate);
        }
      }
      
      if (filters.camera_id) {
        query.camera_id = filters.camera_id;
      }

      const events = await this.db.collection(mongoConfig.collections.events)
        .find(query)
        .sort({ time: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0)
        .toArray();

      return events;
    } catch (error) {
      logger.error("Error getting events from MongoDB:", error);
      throw error;
    }
  }

  async getPersonsWithImages() {
    try {
      await this.connect();
      
      const events = await this.db.collection(mongoConfig.collections.events)
        .find({}, { projection: { person_id: 1, image_id: 1 } })
        .toArray();

      const persons: any = {};

      for (const event of events) {
        const personId = event.person_id;
        const imageId = event.image_id;

        if (!persons[personId]) {
          persons[personId] = {
            person_id: personId,
            images: []
          };
        }

        if (imageId) {
          try {
            const base64Image = await this.getImageAsBase64(imageId);
            if (base64Image) {
              persons[personId].images.push(base64Image);
            }
          } catch (error: any) {
            logger.warn(`Failed to get image ${imageId} for person ${personId}:`, error.message);
          }
        }
      }

      return Object.values(persons);
    } catch (error) {
      logger.error("Error getting persons with images:", error);
      throw error;
    }
  }

  async getStats() {
    try {
      await this.connect();
      
      const totalEvents = await this.db.collection(mongoConfig.collections.events).countDocuments();
      
      const uniquePersons = await this.db.collection(mongoConfig.collections.events)
        .distinct("person_id");
      
      // MinIO count can't easily be gotten like MongoDB. Set to 0 or mock until properly synced
      const totalImages = 0;

      return {
        total_events: totalEvents,
        total_persons: uniquePersons.length,
        total_images: totalImages,
        avg_images_per_person: uniquePersons.length > 0 ? (totalImages / uniquePersons.length) : 0
      };
    } catch (error) {
      logger.error("Error getting statistics:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        logger.info("Disconnected from MongoDB GridFS");
      }
    } catch (error) {
      logger.error("Error disconnecting from MongoDB:", error);
    }
  }
}

export const mongoGridFSService = new MongoGridFSService();
export default mongoGridFSService;
