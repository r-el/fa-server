// MongoDB routes for persons and alerts functionality

import express from "express";
import { mongoGridFSService } from "../services/mongoGridFSService.js";
import { getMongoDBStatus, isMongoDBAvailable } from "../db/mongodb.js";
import os from "os";

const router = express.Router();

// Mock data for when MongoDB is unavailable
const mockPersonsData = {
  success: true,
  persons: [{
    person_id: "demo_person_001",
    images: [{
      image_id: "demo_image_001",
      filename: "demo_person_001_1.jpg",
      timestamp: new Date().toISOString(),
      base64_data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gSW1hZ2U8L3RleHQ+PC9zdmc+"
    }]
  }],
  stats: {
    total_events: 1,
    total_persons: 1,
    total_images: 1,
    avg_images_per_person: 1.0,
    max_images_for_single_person: 1,
    min_images_for_single_person: 1
  }
};

const mockAlertsData = {
  success: true,
  data: [{
    person_id: "demo_person_001",
    time: new Date().toISOString(),
    level: "info",
    image_id: "demo_image_001",
    camera_id: "demo_camera_01",
    message: "Demo alert: MongoDB unavailable, showing mock data",
    image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmZlZGQzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gQWxlcnQ8L3RleHQ+PC9zdmc+"
  }],
  pagination: { limit: 50, skip: 0, total: 1 }
};

// Helper function to check if we're in production
const isProduction = (): boolean => {
  if (process.env.NODE_ENV === "production") return true;
  if (process.env.DYNO) return true;
  const hostname = os.hostname();
  return hostname.includes("herokuapp") || hostname.includes("heroku");
};

// Helper function to check if MongoDB should be used
const shouldUseMongoDB = (): boolean => {
  if (!process.env.MONGODB_URI) {
    console.log("No MONGODB_URI found, using mock data");
    return false;
  }
  if (!isMongoDBAvailable()) {
    console.log("MongoDB not available, using mock data. Status:", getMongoDBStatus());
    return false;
  }
  return true;
};

/**
 * @route   GET /api/mongo/status
 * @desc    Check MongoDB connection status and environment
 * @access  Public
 */
router.get("/status", async (_req, res) => {
  const status = {
    environment: process.env.NODE_ENV || "development",
    isProduction: isProduction(),
    hasMongoDB: !!process.env.MONGODB_URI,
    mongoStatus: getMongoDBStatus(),
    mongoAvailable: isMongoDBAvailable(),
    shouldUseMongoDB: shouldUseMongoDB(),
    hostname: os.hostname(),
    dyno: process.env.DYNO || null,
    timestamp: new Date().toISOString()
  };

  console.log("MongoDB Status Check:", status);
  res.json({ success: true, status });
});

/**
 * @route   GET /api/mongo/persons
 * @desc    Get all persons with their images from MongoDB
 * @access  Public (for demo purposes)
 */
router.get("/persons", async (_req, res) => {
  try {
    if (!shouldUseMongoDB()) {
      console.log("Returning mock data for persons - MongoDB not available or not configured");
      res.json(mockPersonsData);
      return;
    }

    console.log("MongoDB is available, attempting to fetch real data...");
    await mongoGridFSService.connect();
    console.log("GridFS service connected successfully");

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Operation timeout")), 25000);
    });

    const dataPromise = async () => {
      console.log("Fetching persons with images from MongoDB...");
      const persons = await mongoGridFSService.getPersonsWithImages();
      console.log(`Found ${persons.length} persons in MongoDB`);
      const stats = await mongoGridFSService.getStats();
      console.log("Stats fetched:", stats);

      const totalImages = persons.reduce((sum, person) => sum + person.images.length, 0);
      const maxImages = Math.max(...persons.map((person) => person.images.length), 0);
      const minImages = Math.min(...persons.filter((person) => person.images.length > 0).map((person) => person.images.length), 0);

      return {
        persons,
        stats: {
          ...stats,
          total_persons: persons.length,
          total_images: totalImages,
          avg_images_per_person: persons.length > 0 ? totalImages / persons.length : 0,
          max_images_for_single_person: maxImages,
          min_images_for_single_person: minImages || 0,
        }
      };
    };

    const result = await Promise.race([dataPromise(), timeoutPromise]);
    if (!result.persons || result.persons.length === 0) {
      console.log("No real data found in MongoDB, but connection is working. Database appears empty.");
      res.json({
        success: true,
        persons: [],
        stats: {
          total_events: 0,
          total_persons: 0,
          total_images: 0,
          avg_images_per_person: 0,
          max_images_for_single_person: 0,
          min_images_for_single_person: 0,
        }
      });
      return;
    }

    res.json({ success: true, persons: result.persons, stats: result.stats });
  } catch (error) {
    console.log("MongoDB error occurred:", error.message);
    console.log("Error stack:", error.stack);
    console.log("Returning mock data for persons endpoint due to error");
    res.json(mockPersonsData);
  }
});

/**
 * @route   GET /api/mongo/alerts
 * @desc    Get all alerts/events from MongoDB with images
 * @access  Public (for demo purposes)
 */
router.get("/alerts", async (req, res) => {
  try {
    if (!shouldUseMongoDB()) {
      console.log("Returning mock data for alerts - MongoDB not available or not configured");
      res.json(mockAlertsData);
      return;
    }

    await mongoGridFSService.connect();
    const { level, camera_id, limit = "50", skip = "0" } = req.query;
    const filters = {
      level: typeof level === "string" ? level : undefined,
      camera_id: typeof camera_id === "string" ? camera_id : undefined,
      limit: Number.parseInt(String(limit), 10),
      skip: Number.parseInt(String(skip), 10),
    };

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Operation timeout")), 25000);
    });
    const dataPromise = async () => {
      const events = await mongoGridFSService.getEvents(filters);
      return Promise.all(events.map(async (event) => {
        const alertData = {
          person_id: event.person_id,
          time: event.time,
          level: event.level || "info",
          image_id: event.image_id,
          camera_id: event.camera_id,
          message: event.message || `Person detected: ${event.person_id}`,
          image: null as string | null,
        };

        if (event.image_id) {
          try {
            alertData.image = await mongoGridFSService.getImageAsBase64(event.image_id as string);
          } catch (error) {
            console.warn(`Failed to get image ${event.image_id}:`, error.message);
          }
        }
        return alertData;
      }));
    };

    const alertsWithImages = await Promise.race([dataPromise(), timeoutPromise]);
    res.json({
      success: true,
      data: alertsWithImages,
      pagination: { limit: filters.limit, skip: filters.skip, total: alertsWithImages.length },
    });
  } catch (error) {
    console.log("MongoDB error for alerts:", error.message);
    console.log("Returning mock data for alerts endpoint");
    res.json(mockAlertsData);
  }
});

/**
 * @route   GET /api/mongo/image/:imageId
 * @desc    Get specific image by ID
 * @access  Public (for demo purposes)
 */
router.get("/image/:imageId", async (req, res) => {
  try {
    const { imageId } = req.params;
    const { format = "base64" } = req.query;

    if (format === "base64") {
      const base64Image = await mongoGridFSService.getImageAsBase64(imageId);
      if (!base64Image) {
        res.status(404).json({ success: false, error: "Image not found" });
        return;
      }
      res.json({ success: true, image: base64Image, image_id: imageId });
      return;
    }

    const imageData = await mongoGridFSService.getImageById(imageId);
    if (!imageData) {
      res.status(404).json({ success: false, error: "Image not found" });
      return;
    }

    res.set({
      "Content-Type": imageData.contentType,
      "Content-Length": imageData.length,
      "Content-Disposition": `inline; filename="${imageData.filename}"`,
    });
    imageData.stream.pipe(res);
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ success: false, error: "Failed to fetch image", message: error.message });
  }
});

/**
 * @route   GET /api/mongo/stats
 * @desc    Get database statistics
 * @access  Public (for demo purposes)
 */
router.get("/stats", async (_req, res) => {
  try {
    const stats = await mongoGridFSService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, error: "Failed to fetch statistics", message: error.message });
  }
});

// Debug endpoint to check database contents
router.get("/debug-db", async (_req, res) => {
  try {
    if (!shouldUseMongoDB()) {
      res.json({ error: "MongoDB not available" });
      return;
    }

    await mongoGridFSService.connect();
    const db = mongoGridFSService.db;
    if (!db) throw new Error("MongoDB GridFS is not connected");

    const eventsCount = await db.collection("events").countDocuments();
    const photosCount = await db.collection("photos.files").countDocuments();
    const sampleEvents = await db.collection("events").find({}).limit(3).toArray();
    const samplePhotos = await db.collection("photos.files").find({}).limit(3).toArray();

    res.json({
      success: true,
      debug: {
        eventsCount,
        photosCount,
        sampleEvents,
        samplePhotos: samplePhotos.map((photo) => ({ _id: photo._id, filename: photo.filename, contentType: photo.contentType }))
      }
    });
  } catch (error) {
    res.json({ error: error.message, stack: error.stack });
  }
});

export default router;