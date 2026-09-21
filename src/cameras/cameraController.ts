import logger from "@core/utils/logger.js";
import { Response } from "express";
import { TypedRequest } from "~types/request.js";
import { container } from "@core/di.js";
import { CameraService } from "./cameraService.js";
import { validate } from "@core/validationService.js";

import {
  createCameraSchema,
  updateCameraSchema,
  assignCameraSchema,
  cameraIdSchema,
  getCamerasQuerySchema,
} from "./cameraSchemas.js";

export class CameraController {
  /**
   * Create a new camera
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createCamera(req: TypedRequest<typeof createCameraSchema>, res: Response) {
    try {
      // Validate request body
      const value = validate(req.body, createCameraSchema);

      // Get user info from token
      const { id: userId, role } = req.user;

      // Create camera
      const camera = await container.resolve(CameraService).createCamera(value, userId, role);

      res.status(201).json({
        success: true,
        message: "Camera created successfully",
        data: camera,
      });
    } catch (error) {
      logger.error("Create camera error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get cameras for the authenticated user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCameras(req: TypedRequest<typeof getCamerasQuerySchema>, res: Response) {
    try {
      // Validate query parameters
      const value = validate(req.query, getCamerasQuerySchema);

      const { id: userId, role } = req.user;

      // Get cameras for user
      // Note: we might need to pass value to service if it supports pagination/search
      const cameras = await container.resolve(CameraService).getCamerasForUser(userId, role);

      res.json({
        success: true,
        message: "Cameras retrieved successfully",
        data: cameras,
        total: cameras.length,
      });
    } catch (error) {
      logger.error("Get cameras error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get camera by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCameraById(req: TypedRequest<typeof cameraIdSchema>, res: Response) {
    try {
      // Validate camera ID parameter
      const value = validate(req.params, cameraIdSchema);

      const { id: userId, role } = req.user;
      const { camera_id } = value;

      // Get camera
      const camera = await container.resolve(CameraService).getCameraById(camera_id, userId, role);

      res.json({
        success: true,
        message: "Camera retrieved successfully",
        data: camera,
      });
    } catch (error) {
      logger.error("Get camera by ID error:", error);
      const statusCode = error.message.includes("permissions") ? 403 : 404;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Update camera
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateCamera(req: TypedRequest<typeof updateCameraSchema>, res: Response) {
    try {
      // Validate camera ID parameter
      const idValue = validate(req.params, cameraIdSchema);

      // Validate request body
      const bodyValue = validate(req.body, updateCameraSchema);

      const { id: userId, role } = req.user;
      const { camera_id } = idValue;

      // Update camera
      const updatedCamera = await container.resolve(CameraService).updateCamera(camera_id, bodyValue, userId, role);

      res.json({
        success: true,
        message: "Camera updated successfully",
        data: updatedCamera,
      });
    } catch (error) {
      logger.error("Update camera error:", error);
      const statusCode = error.message.includes("permissions") ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Delete camera
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteCamera(req: TypedRequest<typeof cameraIdSchema>, res: Response) {
    try {
      // Validate camera ID parameter
      const value = validate(req.params, cameraIdSchema);

      const { id: userId, role } = req.user;
      const { camera_id } = value;

      // Delete camera
      await container.resolve(CameraService).deleteCamera(camera_id, userId, role);

      res.json({
        success: true,
        message: "Camera deleted successfully",
      });
    } catch (error) {
      logger.error("Delete camera error:", error);
      const statusCode = error.message.includes("permissions") ? 403 : 404;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Assign camera to user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async assignCamera(req: TypedRequest<typeof assignCameraSchema>, res: Response) {
    try {
      // Validate camera ID parameter
      const { camera_id } = validate(req.params, cameraIdSchema);

      // Validate request body
      const validatedData = validate(req.body, assignCameraSchema);

      const { id: userId, role } = req.user;
      const { user_id } = validatedData;

      // Assign camera
      const assignment = await container.resolve(CameraService).assignCameraToUser(camera_id, user_id, userId, role);

      res.status(201).json({
        success: true,
        message: "Camera assigned successfully",
        data: assignment,
      });
    } catch (error) {
      logger.error("Assign camera error:", error);
      const statusCode = error.message.includes("permissions") ? 403 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Remove camera assignment
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async removeAssignment(req: TypedRequest<any>, res: Response) {
    try {
      // Validate camera ID parameter
      const idValue = validate(req.params, cameraIdSchema);

      // Validate user ID parameter
      const userValue = validate(req.params, assignCameraSchema);

      const { id: userId, role } = req.user;
      const { camera_id } = idValue;
      const { user_id } = userValue;

      // Remove assignment
      await container.resolve(CameraService).removeCameraAssignment(camera_id, user_id, userId, role);

      res.json({
        success: true,
        message: "Camera assignment removed successfully",
      });
    } catch (error) {
      logger.error("Remove assignment error:", error);
      const statusCode = error.message.includes("permissions") ? 403 : 404;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Get camera assignments
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getCameraAssignments(req: TypedRequest<typeof cameraIdSchema>, res: Response) {
    try {
      // Validate camera ID parameter
      const value = validate(req.params, cameraIdSchema);

      const { id: userId, role } = req.user;
      const { camera_id } = value;

      // Get assignments
      const assignments = await container.resolve(CameraService).getCameraAssignments(camera_id, userId, role);

      res.json({
        success: true,
        message: "Camera assignments retrieved successfully",
        data: assignments,
      });
    } catch (error) {
      logger.error("Get camera assignments error:", error);
      const statusCode = error.message.includes("permissions") ? 403 : 404;
      res.status(statusCode).json({
        success: false,
        message: error.message,
      });
    }
  }
}
