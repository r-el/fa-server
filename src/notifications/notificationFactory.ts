/**
 * Notification Factory
 *
 * Pure functions that build Notification objects from raw event data.
 * No I/O, no side effects — easy to test in isolation.
 *
 * When a new notification kind is added, add a factory function here
 * and a corresponding type in `types.ts`.
 */

import type {
  Notification,
  NotificationLevel,
  UnauthorizedPersonNotification,
  CameraStatusNotification,
  SystemNotification,
} from "./types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Maps a detection confidence score to a user-facing severity level.
 * High confidence (≥ 0.8) → critical, medium (≥ 0.5) → warning, else info.
 */
export function confidenceToLevel(confidence: number): NotificationLevel {
  if (confidence >= 0.8) return "critical";
  if (confidence >= 0.5) return "warning";
  return "info";
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

export function unauthorizedPerson(params: {
  cameraId: string;
  cameraName: string;
  personId: string;
  confidence: number;
  snapshotUrl?: string | null;
}): UnauthorizedPersonNotification {
  return {
    kind: "unauthorized_person",
    cameraId: params.cameraId,
    cameraName: params.cameraName,
    personId: params.personId,
    confidence: params.confidence,
    level: confidenceToLevel(params.confidence),
    snapshotUrl: params.snapshotUrl ?? null,
    timestamp: nowISO(),
  };
}

export function cameraStatus(params: {
  cameraId: string;
  cameraName: string;
  status: CameraStatusNotification["status"];
  message?: string | null;
}): CameraStatusNotification {
  const level: NotificationLevel = params.status === "error" ? "critical" : "info";
  return {
    kind: "camera_status",
    cameraId: params.cameraId,
    cameraName: params.cameraName,
    status: params.status,
    message: params.message ?? null,
    level,
    timestamp: nowISO(),
  };
}

export function system(
  message: string,
  level: NotificationLevel = "info",
): SystemNotification {
  return {
    kind: "system",
    message,
    level,
    timestamp: nowISO(),
  };
}
