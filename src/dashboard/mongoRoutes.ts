import logger from "@core/utils/logger.js";
// MongoDB routes for persons and alerts functionality

import express from "express";
import { mongoGridFSService } from "./mongoGridFSService.js";
import { minioStorageService } from "./minioStorageService.js";
import { isMongoDBAvailable, getMongoDBStatus } from "@core/db/mongodb.js";
import os from "os";

const router = express.Router();

// Mock data for when MongoDB is unavailable
const mockPersonsData = {
  success: true,
  persons: [
    {
      person_id: "demo_person_001",
      images: [
        {
          image_id: "demo_image_001",
          filename: "demo_person_001_1.jpg",
          timestamp: new Date().toISOString(),
          base64_data: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gSW1hZ2U8L3RleHQ+PC9zdmc+"
        }
      ]
    }
  ],
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
  data: [
    {
      person_id: "demo_person_001",
      time: new Date().toISOString(),
      level: "high",
      image_id: "demo_image_001",
      camera_id: "demo_cam_1",
      message: "Person detected: demo_person_001",
      image: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRlbW8gSW1hZ2U8L3RleHQ+PC9zdmc+"
    }
  ],
  pagination: {
    limit: 50,
    skip: 0,
    total: 1
  }
};

// Check if we're in production
const isProduction = () => process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'docker';

// Helper to determine if we should try to use MongoDB
const shouldUseMongoDB = () => {
  if (!process.env.MONGODB_URI) {
    logger.info('No MONGODB_URI found, using mock data');
    return false;
  }
  if (!isMongoDBAvailable()) {
    logger.info('MongoDB not available, using mock data. Status:', getMongoDBStatus());
    return false;
  }
  return true;
};

router.get("/status", async (req: any, res: any) => {
  const status = {
    environment: process.env.NODE_ENV || 'development',
    isProduction: isProduction(),
    hasMongoDB: !!process.env.MONGODB_URI,
    mongoStatus: getMongoDBStatus(),
    mongoAvailable: isMongoDBAvailable(),
    shouldUseMongoDB: shouldUseMongoDB(),
    hostname: os.hostname(),
    dyno: process.env.DYNO || null,
    timestamp: new Date().toISOString()
  };

  res.json({ success: true, status });
});

router.get("/persons", async (req: any, res: any) => {
  try {
    if (!shouldUseMongoDB()) {
      return res.json(mockPersonsData);
    }

    await mongoGridFSService.connect();

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), 25000);
    });

    const dataPromise = async () => {
      const persons = await mongoGridFSService.getPersonsWithImages();
      const stats = await mongoGridFSService.getStats();

      const totalImages = (persons as any[]).reduce((sum, person) => sum + (person as any).images.length, 0);
      const avgImagesPerPerson = (persons as any[]).length > 0 ? totalImages / (persons as any[]).length : 0;
      const maxImages = Math.max(...(persons as any[]).map((p) => (p as any).images.length), 0);
      const minImages = Math.min(...(persons as any[]).filter((p) => (p as any).images.length > 0).map((p) => (p as any).images.length), 0);

      const result = {
        persons,
        stats: {
          ...stats,
          total_persons: (persons as any[]).length,
          total_images: totalImages as number,
          avg_images_per_person: avgImagesPerPerson,
          max_images_for_single_person: maxImages as number,
          min_images_for_single_person: minImages as number || 0,
        }
      };

      return result;
    };

    const result = await Promise.race([dataPromise(), timeoutPromise]);

    if (!(result as any).persons || (result as any).persons.length === 0) {
      return res.json({
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
    }

    res.json({
      success: true,
      persons: (result as any).persons,
      stats: (result as any).stats,
    });
  } catch (error: any) {
    logger.info('Returning mock data for persons endpoint due to error');
    res.json(mockPersonsData);
  }
});

router.get("/alerts", async (req: any, res: any) => {
  try {
    if (!shouldUseMongoDB()) {
      return res.json(mockAlertsData);
    }

    await mongoGridFSService.connect();

    const { level, camera_id, limit = 50, skip = 0 } = req.query;

    const filters = {
      level,
      camera_id,
      limit: parseInt(limit),
      skip: parseInt(skip),
    };

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), 25000);
    });

    const dataPromise = async () => {
      const events = await mongoGridFSService.getEvents(filters);

      const alertsWithImages = await Promise.all(
        events.map(async (event: any) => {
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
              const base64Image = await minioStorageService.getImageAsBase64(event.image_id);
              alertData.image = base64Image;
            } catch (error: any) {
              logger.warn(`Failed to get image ${event.image_id}:`, error.message);
            }
          }

          return alertData;
        })
      );

      return alertsWithImages;
    };

    const alertsWithImages = await Promise.race([dataPromise(), timeoutPromise]);

    res.json({
      success: true,
      data: alertsWithImages,
      pagination: {
        limit: filters.limit,
        skip: filters.skip,
        total: (alertsWithImages as any[]).length,
      },
    });
  } catch (error: any) {
    res.json(mockAlertsData);
  }
});

router.get("/image/:imageId", async (req: any, res: any) => {
  try {
    const { imageId } = req.params;
    const { format = "base64" } = req.query;

    if (format === "base64") {
      const base64Image = await minioStorageService.getImageAsBase64(imageId);

      if (!base64Image) {
        return res.status(404).json({ success: false, error: "Image not found" });
      }

      res.json({
        success: true,
        image: base64Image,
        image_id: imageId,
      });
    } else {
      const imageData = await minioStorageService.getImageStream(imageId);

      if (!imageData) {
        return res.status(404).json({ success: false, error: "Image not found" });
      }

      res.set({
        "Content-Type": imageData.contentType,
        "Content-Length": imageData.contentLength,
        "Content-Disposition": `inline; filename="${imageId}"`,
      });

      imageData.stream.pipe(res);
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to fetch image", message: error.message });
  }
});

router.get("/stats", async (req: any, res: any) => {
  try {
    const stats = await mongoGridFSService.getStats();

    res.json({
      success: true,
      stats: stats,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: "Failed to fetch statistics", message: error.message });
  }
});

router.get('/debug-db', async (req: any, res: any) => {
  try {
    if (!shouldUseMongoDB()) {
      return res.json({ error: 'MongoDB not available' });
    }

    await mongoGridFSService.connect();

    const eventsCount = await mongoGridFSService.db.collection('Event').countDocuments();
    const photosCount = 0; // Using MinIO now

    const sampleEvents = await mongoGridFSService.db.collection('Event').find({}).limit(3).toArray();

    res.json({
      success: true,
      debug: {
        eventsCount,
        photosCount,
        sampleEvents,
        samplePhotos: []
      }
    });
  } catch (error: any) {
    res.json({ error: error.message, stack: error.stack });
  }
});

export default router;
