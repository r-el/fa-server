import { z } from "zod";
import { specterIdSchema } from "@cameras/cameraSchemas.js";

const timestampSchema = z.string().datetime({ offset: true, message: "Must be an ISO 8601 time with a time zone" });
// Express reads ?camera_id=a&camera_id=b as a list and a single camera_id as a string.
const cameraIdsSchema = z
  .union([specterIdSchema("Camera"), z.array(specterIdSchema("Camera")).max(500)])
  .transform((value) => (Array.isArray(value) ? value : [value]));

export const listAlertsQuerySchema = z.object({
  camera_id: cameraIdsSchema.optional(),
  kind: z.enum(["identity_match", "rule"]).optional(),
  disposition: z.enum(["unreviewed", "true_positive", "false_positive"]).optional(),
  created_since: timestampSchema.optional(),
  created_until: timestampSchema.optional(),
  cursor: z.string().max(500).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const alertSummaryQuerySchema = listAlertsQuerySchema.pick({
  camera_id: true,
  created_since: true,
  created_until: true,
});

export const alertIdSchema = z.object({
  alert_id: specterIdSchema("Alert"),
});

export const resolveAlertSchema = z.object({
  disposition: z.enum(["true_positive", "false_positive"]),
  note: z.string().trim().max(1000).optional(),
});
