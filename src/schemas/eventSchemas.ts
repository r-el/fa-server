// Zod validation schemas for event-related operations.

import { z } from "zod";

const dateRange = {
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
};

// Schema for getting events with query parameters.
export const getEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  level: z.enum(["low", "medium", "high"]).optional(),
  ...dateRange,
  cameraId: z.string().trim().optional(),
}).refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const eventIdSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid event ID format"),
});

export const imageQuerySchema = z.object({
  download: z.coerce.boolean().default(false),
  format: z.enum(["jpeg", "jpg", "png"]).default("jpeg"),
});

export const eventsStatsQuerySchema = z.object({
  ...dateRange,
  level: z.enum(["low", "medium", "high"]).optional(),
}).refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});