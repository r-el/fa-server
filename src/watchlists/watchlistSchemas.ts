import { z } from "zod";
import { specterIdSchema } from "@cameras/cameraSchemas.js";

export const watchlistParams = z.object({
  watchlist_id: specterIdSchema("Watchlist"),
});

export const targetParams = watchlistParams.extend({
  target_id: specterIdSchema("Target"),
});

export const imageParams = targetParams.extend({
  image_id: specterIdSchema("Image"),
});

export const batchParams = z.object({
  enrollment_batch_id: specterIdSchema("Enrollment batch"),
});

export const createTargetsBody = z.object({
  targets: z.string().min(2).max(100_000),
});

export const watchlistSchema = z.object({
  params: watchlistParams,
});

export const targetSchema = z.object({
  params: targetParams,
});

export const imageSchema = z.object({
  params: imageParams,
});

export const enrollmentBatchSchema = z.object({
  params: batchParams,
});
