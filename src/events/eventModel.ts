import logger from "@core/utils/logger.js";
// Handles event-related database operations

import { getEventsCollection, getPhotoStorageBucket } from "@core/db/mongodb.js";
import { ObjectId } from "mongodb";

export class Event {
  /**
   * Get events by camera IDs with pagination
   * @param {Array} cameraIds - Array of camera IDs to filter by
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10)
   * @param {string} (options as any).level - Filter by level (optional)
   * @param {Date} (options as any).startDate - Filter events from date (optional)
   * @param {Date} (options as any).endDate - Filter events to date (optional)
   * @returns {Promise<Object>} Events data with pagination info
   */
  static async getEventsByCameraIds(cameraIds: string[], options: any = {}) {
    try {
      const eventsCollection = getEventsCollection();
      
      const {
        page = 1,
        limit = 10,
        level,
        startDate,
        endDate
      } = options;

      const skip = (page - 1) * limit;

      // Build query filter
      const filter: any = {
        camera_id: { $in: cameraIds }
      };

      // Add level filter if provided
      if ((options as any).level) {
        filter.level = level;
      }

      // Add date range filter if provided
      if ((options as any).startDate || (options as any).endDate) {
        filter.Processing_time = {};
        if (startDate) filter.Processing_time.$gte = new Date(startDate);
        if (endDate) filter.Processing_time.$lte = new Date(endDate);
      }

      // Get total count for pagination
      const total = await eventsCollection.countDocuments(filter);

      // Get events with pagination
      const events = await eventsCollection
        .find(filter)
        .sort({ Processing_time: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return {
        events,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page < Math.ceil(total / limit),
          hasPrevPage: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get events: ${error.message}`);
    }
  }

  /**
   * Get event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} Event data
   */
  static async getEventById(eventId) {
    try {
      const eventsCollection = getEventsCollection();
      
      const event = await eventsCollection.findOne({
        _id: new ObjectId(eventId)
      });

      if (!event) {
        throw new Error("Event not found");
      }

      return event;
    } catch (error) {
      throw new Error(`Failed to get event: ${error.message}`);
    }
  }

  /**
   * Get image by ID from GridFS
   * @param {ObjectId} imageId - Image ID
   * @returns {Promise<Buffer>} Image buffer
   */
  static async getImageById(imageId) {
    try {
      const bucket = getPhotoStorageBucket();
      
      if (!bucket) {
        throw new Error("Photo storage bucket not available");
      }

      // Convert string to ObjectId if needed
      const objectId = typeof imageId === "string" ? new ObjectId(imageId) : imageId;

      // Check if image exists
      const files = await bucket.find({ _id: objectId }).toArray();
      if (files.length === 0) {
        throw new Error("Image not found");
      }

      // Create download stream
      const downloadStream = bucket.openDownloadStream(objectId);
      
      // Collect chunks
      const chunks = [];
      
      return new Promise((resolve, reject) => {
        downloadStream.on("data", (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on("end", () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });

        downloadStream.on("error", (error) => {
          logger.error("GridFS download error:", error);
          reject(new Error(`Failed to download image: ${error.message}`));
        });

        // Add timeout protection
        setTimeout(() => {
          downloadStream.destroy();
          reject(new Error("Image download timeout"));
        }, 30000); // 30 second timeout
      });
    } catch (error) {
      logger.error("Error getting image by ID:", error);
      throw new Error(`Failed to retrieve image: ${error.message}`);
    }
  }

  /**
   * Get events count by camera IDs
   * @param {Array} cameraIds - Array of camera IDs
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} Total events count
   */
  static async getEventsCount(cameraIds, filters = {}) {
    try {
      const eventsCollection = getEventsCollection();
      
      const filter: any = {
        camera_id: { $in: cameraIds }
      };

      // Add additional filters
      if ((filters as any).level) {
        filter.level = (filters as any).level;
      }

      if ((filters as any).startDate || (filters as any).endDate) {
        filter.Processing_time = {};
        if ((filters as any).startDate) filter.Processing_time.$gte = new Date((filters as any).startDate);
        if ((filters as any).endDate) filter.Processing_time.$lte = new Date((filters as any).endDate);
      }

      return await eventsCollection.countDocuments(filter);
    } catch (error) {
      throw new Error(`Failed to get events count: ${error.message}`);
    }
  }

  /**
   * Get events grouped by level (statistics)
   * @param {Array} cameraIds - Array of camera IDs
   * @returns {Promise<Array>} Events grouped by level
   */
  static async getEventsStatsByLevel(cameraIds) {
    try {
      const eventsCollection = getEventsCollection();
      
      const pipeline = [
        {
          $match: {
            camera_id: { $in: cameraIds }
          }
        },
        {
          $group: {
            _id: "$level",
            count: { $sum: 1 },
            latestEvent: { $max: "$Processing_time" }
          }
        },
        {
          $sort: { count: -1 }
        }
      ];

      return await eventsCollection.aggregate(pipeline).toArray();
    } catch (error) {
      throw new Error(`Failed to get events statistics: ${error.message}`);
    }
  }
}
