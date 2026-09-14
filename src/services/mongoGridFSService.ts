// MongoDB GridFS service for handling image storage and retrieval

import { GridFSBucket, MongoClient, type Db, type Document } from "mongodb";
import { mongoConfig } from "../config/database.js";
import { getMongoDBStatus, isMongoDBAvailable } from "../db/mongodb.js";
import { errorMessage } from "../utils/errorMessage.js";

interface EventFilters {
  level?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  camera_id?: string;
  limit?: number;
  skip?: number;
}

interface ImageData {
  stream: NodeJS.ReadableStream;
  contentType: string;
  filename: string;
  length: number;
}

interface PersonWithImages {
  person_id: string;
  images: string[];
}

class MongoGridFSService {
  private client: MongoClient | null = null;
  db: Db | null = null;
  private bucket: GridFSBucket | null = null;
  private isConnected = false;

  private getDatabase(): Db {
    if (!this.db) throw new Error("MongoDB GridFS is not connected");
    return this.db;
  }

  private getBucket(): GridFSBucket {
    if (!this.bucket) throw new Error("MongoDB GridFS bucket is not initialized");
    return this.bucket;
  }

  // Connect to MongoDB and initialize GridFS bucket
  async connect(): Promise<Db> {
    try {
      if (this.isConnected) {
        return this.getDatabase();
      }

      // Check if MongoDB URI is configured
      const uri = mongoConfig.uri;
      if (!uri) {
        throw new Error("MongoDB URI not configured. Please set MONGODB_URI environment variable.");
      }

      // Check if MongoDB is available from main connection
      if (!isMongoDBAvailable()) {
        const status = getMongoDBStatus();
        throw new Error(`MongoDB not available. Status: ${status}`);
      }

      this.client = new MongoClient(uri, mongoConfig.options);
      await this.client.connect();

      this.db = this.client.db(mongoConfig.dbName);
      this.bucket = new GridFSBucket(this.db, {
        bucketName: mongoConfig.collections.photoStorage,
      });

      this.isConnected = true;
      console.log("Connected to MongoDB GridFS successfully");

      return this.db;
    } catch (error) {
      console.error("Failed to connect to MongoDB GridFS:", error);
      throw error;
    }
  }

  // Get image from GridFS by image_id
  async getImageById(imageId: string): Promise<ImageData | null> {
    try {
      await this.connect();
      const db = this.getDatabase();
      const bucket = this.getBucket();

      // Find file document by metadata.image_id
      const fileDoc = await db
        .collection(`${mongoConfig.collections.photoStorage}.files`)
        .findOne({ "metadata.image_id": imageId });

      if (!fileDoc) return null;

      // Get the file data from GridFS
      const downloadStream = bucket.openDownloadStream(fileDoc._id);

      return {
        stream: downloadStream,
        contentType: fileDoc.contentType || "image/jpeg",
        filename: fileDoc.filename,
        length: fileDoc.length,
      };
    } catch (error) {
      console.error("Error getting image from GridFS:", error);
      throw error;
    }
  }

  // Get image as base64 string
  async getImageAsBase64(imageId: string): Promise<string | null> {
    try {
      const imageData = await this.getImageById(imageId);

      if (!imageData) return null;

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        imageData.stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        imageData.stream.on("end", () => {
          const buffer = Buffer.concat(chunks);
          const base64String = buffer.toString("base64");
          resolve(`data:${imageData.contentType};base64,${base64String}`);
        });
        imageData.stream.on("error", (error) => reject(error));
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
    }
  }

  // Get all events from MongoDB
  async getEvents(filters: EventFilters = {}): Promise<Document[]> {
    try {
      await this.connect();
      const db = this.getDatabase();
      const query: Document = {};

      // Apply level filter
      if (filters.level) query.level = filters.level;

      // Apply date range filter
      if (filters.startDate || filters.endDate) {
        query.time = {};
        if (filters.startDate) query.time.$gte = new Date(filters.startDate);
        if (filters.endDate) query.time.$lte = new Date(filters.endDate);
      }

      // Apply camera filter
      if (filters.camera_id) query.camera_id = filters.camera_id;

      return db
        .collection(mongoConfig.collections.events)
        .find(query)
        .sort({ time: -1 })
        .limit(filters.limit || 50)
        .skip(filters.skip || 0)
        .toArray();
    } catch (error) {
      console.error("Error getting events from MongoDB:", error);
      throw error;
    }
  }

  // Get persons with their images
  async getPersonsWithImages(): Promise<PersonWithImages[]> {
    try {
      await this.connect();
      const db = this.getDatabase();
      const events = await db
        .collection(mongoConfig.collections.events)
        .find({}, { projection: { person_id: 1, image_id: 1 } })
        .toArray();
      const persons: Record<string, PersonWithImages> = {};

      for (const event of events) {
        const personId = event.person_id as string;
        const imageId = event.image_id as string | undefined;

        if (!persons[personId]) persons[personId] = { person_id: personId, images: [] };

        if (imageId) {
          try {
            const base64Image = await this.getImageAsBase64(imageId);
            if (base64Image) persons[personId].images.push(base64Image);
          } catch (error) {
            console.warn(`Failed to get image ${imageId} for person ${personId}:`, errorMessage(error));
          }
        }
      }

      return Object.values(persons);
    } catch (error) {
      console.error("Error getting persons with images:", error);
      throw error;
    }
  }

  // Get statistics
  async getStats(): Promise<{
    total_events: number;
    total_persons: number;
    total_images: number;
    avg_images_per_person: number;
  }> {
    try {
      await this.connect();
      const db = this.getDatabase();
      const totalEvents = await db.collection(mongoConfig.collections.events).countDocuments();
      const uniquePersons = await db.collection(mongoConfig.collections.events).distinct("person_id");
      const totalImages = await db
        .collection(`${mongoConfig.collections.photoStorage}.files`)
        .countDocuments();

      return {
        total_events: totalEvents,
        total_persons: uniquePersons.length,
        total_images: totalImages,
        avg_images_per_person: uniquePersons.length > 0 ? totalImages / uniquePersons.length : 0,
      };
    } catch (error) {
      console.error("Error getting statistics:", error);
      throw error;
    }
  }

  // Close connection
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
        this.db = null;
        this.bucket = null;
        this.isConnected = false;
        console.log("Disconnected from MongoDB GridFS");
      }
    } catch (error) {
      console.error("Error disconnecting from MongoDB:", error);
    }
  }
}

// Create singleton instance
export const mongoGridFSService = new MongoGridFSService();
export default mongoGridFSService;