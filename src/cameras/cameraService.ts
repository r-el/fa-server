// BLL for camera operations

import { Camera } from "./cameraModel.js";

import { inject, injectable } from "tsyringe";
import {
  canManageAssignments,
  canManageCamera,
  canViewCamera,
  CameraAccessSubject,
  CameraRole,
} from "@cameras/domain/cameraAccess.js";
import { CameraRepository } from "@cameras/domain/cameraRepository.js";
import { CAMERA_REPOSITORY } from "@cameras/infrastructure/tokens.js";

@injectable()
export class CameraService {
  constructor(@inject(CAMERA_REPOSITORY) private readonly cameraRepository: CameraRepository) {}
  /**
   * Create a new camera
   * @param {Object} cameraData - Camera data
   * @param {string} userId - ID of user creating the camera
   * @param {string} userRole - Role of user creating the camera
   * @returns {Promise<Object>} Created camera
   */
  async createCamera(cameraData, userId, userRole) {
    // Only operators and admins can create cameras
    if (!["operator", "admin"].includes(userRole))
      throw new Error("Insufficient permissions to create camera");

    try {
      const camera = await this.cameraRepository.create({ ...cameraData, created_by: userId });

      return camera;
    } catch (error) {
      if (error.message.includes("duplicate key")) throw new Error("Camera ID already exists");

      throw error;
    }
  }

  /**
   * Get cameras for a user based on their role
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Array>} Array of cameras
   */
  async getCamerasForUser(userId, userRole) {
    try {
      if (userRole === "admin") return await this.cameraRepository.findAll();
      if (userRole === "operator") return await this.cameraRepository.findCreatedBy(userId);
      return await this.cameraRepository.findAssignedTo(userId);
    } catch (error) {
      throw new Error(`Failed to get cameras: ${error.message}`);
    }
  }

  /**
   * Get camera by ID with authorization check
   * @param {string} cameraId - Camera ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Object>} Camera data
   */
  async getCameraById(cameraId, userId, userRole) {
    try {
      const camera = await this.cameraRepository.findById(cameraId);

      // Check if user has access to this camera
      if (!(await this.userHasAccessToCamera(camera, userId, userRole)))
        throw new Error("Insufficient permissions to access this camera");

      return camera;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Assign camera to user
   * @param {string} cameraId - Camera ID
   * @param {string} targetUserId - User ID to assign camera to
   * @param {string} assignerId - User ID making the assignment
   * @param {string} assignerRole - Role of user making the assignment
   * @returns {Promise<Object>} Assignment data
   */
  async assignCameraToUser(cameraId, targetUserId, assignerId, assignerRole) {
    // Only operators and admins can assign cameras
    if (!["operator", "admin"].includes(assignerRole))
      throw new Error("Insufficient permissions to assign camera");

    try {
      // Check if camera exists and if assigner has access
      const camera = await this.cameraRepository.findById(cameraId);

      if (!canManageAssignments(camera, { id: assignerId, role: assignerRole as CameraRole }))
        throw new Error("Operators can only assign cameras they created");

      const assignment = await this.cameraRepository.assignToUser({
        camera_id: cameraId,
        user_id: targetUserId,
        assigned_by: assignerId,
      });

      return assignment;
    } catch (error) {
      if (error.message.includes("duplicate key")) throw new Error("Camera is already assigned to this user");

      throw error;
    }
  }

  /**
   * Remove camera assignment
   * @param {string} cameraId - Camera ID
   * @param {string} targetUserId - User ID to remove assignment from
   * @param {string} removerId - User ID removing the assignment
   * @param {string} removerRole - Role of user removing the assignment
   * @returns {Promise<boolean>} Success status
   */
  async removeCameraAssignment(cameraId, targetUserId, removerId, removerRole) {
    // Only operators and admins can remove assignments
    if (!["operator", "admin"].includes(removerRole))
      throw new Error("Insufficient permissions to remove camera assignment");

    try {
      // Check if camera exists and if remover has access
      const camera = await this.cameraRepository.findById(cameraId);

      if (!canManageAssignments(camera, { id: removerId, role: removerRole as CameraRole }))
        throw new Error("Operators can only manage assignments for cameras they created");

      return await this.cameraRepository.removeAssignment(cameraId, targetUserId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get camera assignments
   * @param {string} cameraId - Camera ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Array>} Array of assignments
   */
  async getCameraAssignments(cameraId, userId, userRole) {
    try {
      // Check if user has access to this camera
      const camera = await this.cameraRepository.findById(cameraId);

      if (!(await this.userHasAccessToCamera(camera, userId, userRole)))
        throw new Error("Insufficient permissions to view camera assignments");

      return await this.cameraRepository.getAssignments(cameraId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update camera
   * @param {string} cameraId - Camera ID
   * @param {Object} updateData - Data to update
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<Object>} Updated camera data
   */
  async updateCamera(cameraId, updateData, userId, userRole) {
    try {
      const camera = await this.cameraRepository.findById(cameraId);

      // Check permissions
      if (canManageCamera(camera, { id: userId, role: userRole as CameraRole }))
        return await this.cameraRepository.update(cameraId, updateData);
      else throw new Error("Insufficient permissions to update this camera");
    } catch (error) {
      if (error.message.includes("duplicate key")) throw new Error("Camera ID already exists");

      throw error;
    }
  }

  /**
   * Delete camera
   * @param {string} cameraId - Camera ID
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {Promise<boolean>} Success status
   */
  async deleteCamera(cameraId, userId, userRole) {
    try {
      const camera = await this.cameraRepository.findById(cameraId);

      // Check permissions
      if (canManageCamera(camera, { id: userId, role: userRole as CameraRole }))
        return await this.cameraRepository.delete(cameraId);
      else throw new Error("Insufficient permissions to delete this camera");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user has access to a camera
   * @param {Object} camera - Camera object
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {boolean} Whether user has access
   */
  async userHasAccessToCamera(camera, userId, userRole) {
    const subject: CameraAccessSubject = { id: userId, role: userRole as CameraRole };
    const isAssigned = userRole === "viewer" && (await this.cameraRepository.isAssigned(camera.id!, userId));
    return canViewCamera(camera, subject, isAssigned);
  }
}
