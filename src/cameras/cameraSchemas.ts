import { z } from "zod";

// Camera creation schema
export const createCameraSchema = z.object({
  name: z.string().trim()
    .min(1, "Camera name must be at least 1 character")
    .max(100, "Camera name must not exceed 100 characters"),

  camera_id: z.string().trim()
    .min(1, "Camera ID must be at least 1 character")
    .max(50, "Camera ID must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Camera ID can only contain letters, numbers, underscores, and hyphens"),

  connection_string: z.string().trim()
    .min(1, "Connection string must be at least 1 character")
    .max(500, "Connection string must not exceed 500 characters"),
});

// Camera update schema (all fields optional)
export const updateCameraSchema = z.object({
  name: z.string().trim()
    .min(1, "Camera name must be at least 1 character")
    .max(100, "Camera name must not exceed 100 characters")
    .optional(),

  camera_id: z.string().trim()
    .min(1, "Camera ID must be at least 1 character")
    .max(50, "Camera ID must not exceed 50 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Camera ID can only contain letters, numbers, underscores, and hyphens")
    .optional(),

  connection_string: z.string().trim()
    .min(1, "Connection string must be at least 1 character")
    .max(500, "Connection string must not exceed 500 characters")
    .optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

// Camera assignment schema
export const assignCameraSchema = z.object({
  user_id: z.string().uuid("User ID must be a valid UUID"),
});

// Camera ID parameter schema
export const cameraIdSchema = z.object({
  camera_id: z.string().uuid("Camera ID must be a valid UUID"),
});

// Query parameters schema for camera listing
export const getCamerasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100, "Search term must not exceed 100 characters").optional(),
});
