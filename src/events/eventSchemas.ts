// Joi validation schemas for event-related operations

import { z } from "zod";

// Schema for getting events with query parameters
export const getEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  level: z.enum(["low", "medium", "high"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  cameraId: z.string().trim().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "endDate must be after startDate",
  path: ["endDate"]
});

// Schema for event ID parameter
export const eventIdSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Must be a valid 24-character hex string (ObjectId)")
});

// Schema for image download parameters
export const imageQuerySchema = z.object({
  download: z.preprocess((val) => val === "true" || val === true, z.boolean()).default(false),
  format: z.enum(["jpeg", "jpg", "png"]).default("jpeg")
});

// Schema for events statistics query
export const eventsStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  level: z.enum(["low", "medium", "high"]).optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: "endDate must be after startDate",
  path: ["endDate"]
});
