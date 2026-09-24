import { CameraService } from "@cameras/cameraService.js";
import logger from "@core/utils/logger.js";
import { minioStorageService } from "@dashboard/minioStorageService.js";
// Business logic for event operations with role-based access control

import { Event } from "./eventModel.js";

import { injectable, inject } from "tsyringe";

@injectable()
export class EventService {
  constructor(private cameraService: CameraService) {}

  /**
   * Get events for user based on their accessible cameras
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Events data
   */
  async getEventsForUser(userId: string, userRole: string, options: any = {}) {
    try {
      // Get cameras accessible to user
      const cameras = await this.cameraService.getCamerasForUser(userId, userRole);
      
      if (cameras.length === 0) {
        return {
          events: [],
          pagination: {
            total: 0,
            page: options.page || 1,
            limit: options.limit || 10,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }

      // Extract camera IDs (specter_camera_id or database id)
      const cameraIds = cameras.map(camera => camera.specter_camera_id || camera.id);

      // Get events for these cameras
      return await Event.getEventsByCameraIds(cameraIds, options);
    } catch (error) {
      throw new Error(`Failed to get events for user: ${error.message}`);
    }
  }

  /**
   * Get single event with access control
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Object>} Event data
   */
  async getEventById(eventId, userId, userRole) {
    try {
      // Get the event first
      const event = await Event.getEventById(eventId);

      // Check if user has access to this event's camera
      const hasAccess = await this.userHasAccessToCamera(userId, userRole, event.camera_id);
      
      if (!hasAccess) {
        throw new Error("Access denied to this event");
      }

      return event;
    } catch (error) {
      throw new Error(`Failed to get event: ${error.message}`);
    }
  }

  /**
   * Get event image with access control
   * @param {string} eventId - Event ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Buffer>} Image buffer
   */
  async getEventImage(eventId, userId, userRole) {
    try {
      // First get the event to check access and get image_id
      const event = await this.getEventById(eventId, userId, userRole);
      
      if (!event.image_id) {
        throw new Error("No image associated with this event");
      }

      // Get the image using image_id from event
      const imageBuffer = await minioStorageService.getImageStream(event.image_id);
      
      if (!imageBuffer ) {
        throw new Error("Image data is empty or corrupted");
      }

      return imageBuffer;
    } catch (error) {
      logger.error("Error getting event image:", error);
      
      if (error.message.includes("not found") || error.message.includes("Access denied")) {
        throw error; // Re-throw known errors
      }
      
      throw new Error(`Failed to get event image: ${error.message}`);
    }
  }

  /**
   * Get events statistics for user
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Object>} Events statistics
   */
  async getEventsStatsForUser(userId, userRole) {
    try {
      // Get cameras accessible to user
      const cameras = await this.cameraService.getCamerasForUser(userId, userRole);
      
      if (cameras.length === 0) {
        return {
          totalEvents: 0,
          levelStats: [],
          camerasCount: 0
        };
      }

      const cameraIds = cameras.map(camera => camera.specter_camera_id || camera.id);

      // Get statistics
      const [totalEvents, levelStats] = await Promise.all([
        Event.getEventsCount(cameraIds),
        Event.getEventsStatsByLevel(cameraIds)
      ]);

      return {
        totalEvents,
        levelStats,
        camerasCount: cameras.length
      };
    } catch (error) {
      throw new Error(`Failed to get events statistics: ${error.message}`);
    }
  }

  /**
   * Check if user has access to a specific camera
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {string} cameraId - Camera ID
   * @returns {Promise<boolean>} Access status
   */
  async userHasAccessToCamera(userId, userRole, cameraId) {
    try {
      const cameras = await this.cameraService.getCamerasForUser(userId, userRole);
      return cameras.some(camera => camera.specter_camera_id === cameraId || camera.id === cameraId);
    } catch (error) {
      logger.error("Error checking camera access:", error);
      return false;
    }
  }

  /**
   * Get events with enhanced data (includes camera info)
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Enhanced events data
   */
  async getEnhancedEventsForUser(userId, userRole, options = {}) {
    try {
      const eventsData = await this.getEventsForUser(userId, userRole, options);
      
      if ((eventsData.events as any[]).length === 0) {
        return eventsData;
      }

      // Get user cameras for reference
      const cameras = await this.cameraService.getCamerasForUser(userId, userRole);
      const cameraMap = new Map();
      cameras.forEach(camera => {
        if (camera.specter_camera_id) cameraMap.set(camera.specter_camera_id, camera);
        if (camera.id) cameraMap.set(camera.id, camera);
      });

      // Enhance events with camera information
      const enhancedEvents = eventsData.events.map(event => ({
        ...event,
        camera_info: cameraMap.get(event.camera_id) || null
      }));

      return {
        ...eventsData,
        events: enhancedEvents
      };
    } catch (error) {
      throw new Error(`Failed to get enhanced events: ${error.message}`);
    }
  }
}
