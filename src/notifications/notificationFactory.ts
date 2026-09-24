/**
 * Notification Factory
 *
 * Pure functions that build Notification objects from Specter events and the names fa knows.
 * No I/O, no side effects — easy to test in isolation.
 *
 * When a new notification kind is added, add a factory function here
 * and a corresponding type in `types.ts`.
 */

import type {
  AlertNotification,
  CameraStatusNotification,
  ConfigurationChangedNotification,
  EnrollmentNotification,
  NotificationLevel,
  SystemNotification,
} from "./types.js";
import type {
  CameraStatusChangedMessage,
  ConfigurationChangedMessage,
  EnrollmentStatusChangedMessage,
  MatchConfirmedMessage,
  RuleTriggeredMessage,
} from "@specter/generated/events.js";
import type { CatalogSnapshot } from "@specter/specterCatalog.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function nowISO(): string {
  return new Date().toISOString();
}

function snapshotUrl(messageId: string | undefined, snapshotPath: string | null | undefined): string | null {
  return messageId && snapshotPath ? `/api/alerts/${messageId}/snapshot` : null;
}

/** A match on a blacklist is the reason fa exists; every other alert asks for a look. */
export function matchLevel(watchlistKind: string | null): NotificationLevel {
  return watchlistKind === "blacklist" ? "critical" : "warning";
}

export function cameraStatusLevel(status: CameraStatusNotification["status"]): NotificationLevel {
  if (status === "failed") return "critical";
  if (status === "reconnecting") return "warning";
  return "info";
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

export function matchAlert(message: MatchConfirmedMessage, catalog: CatalogSnapshot): AlertNotification {
  const watchlist = catalog.watchlists.get(message.watchlist_id);
  return {
    kind: "alert",
    alertId: message.message_id,
    alertKind: "identity_match",
    cameraId: message.camera_id,
    cameraName: catalog.cameraNames.get(message.camera_id) ?? null,
    targetId: message.target_id,
    targetLabel: catalog.targetLabels.get(message.target_id) ?? null,
    watchlistName: watchlist?.name ?? null,
    watchlistKind: watchlist?.kind ?? null,
    similarity: message.similarity_ratio,
    ruleKind: null,
    objectClass: message.object_class,
    level: matchLevel(watchlist?.kind ?? null),
    snapshotUrl: snapshotUrl(message.message_id, message.snapshot_path),
    timestamp: message.occurred_at,
  };
}

export function ruleAlert(message: RuleTriggeredMessage, catalog: CatalogSnapshot): AlertNotification {
  return {
    kind: "alert",
    alertId: message.message_id,
    alertKind: "rule",
    cameraId: message.camera_id,
    cameraName: catalog.cameraNames.get(message.camera_id) ?? null,
    targetId: null,
    targetLabel: null,
    watchlistName: null,
    watchlistKind: null,
    similarity: null,
    ruleKind: message.rule_kind,
    objectClass: message.object_class,
    level: "warning",
    snapshotUrl: snapshotUrl(message.message_id, message.snapshot_path),
    timestamp: message.occurred_at,
  };
}

export function cameraStatus(
  message: CameraStatusChangedMessage,
  catalog: CatalogSnapshot,
): CameraStatusNotification {
  return {
    kind: "camera_status",
    cameraId: message.camera_id,
    cameraName: catalog.cameraNames.get(message.camera_id) ?? null,
    status: message.status,
    level: cameraStatusLevel(message.status),
    timestamp: message.occurred_at,
  };
}

export function enrollment(
  message: EnrollmentStatusChangedMessage,
  catalog: CatalogSnapshot,
): EnrollmentNotification {
  return {
    kind: "enrollment",
    targetId: message.target_id,
    targetLabel: catalog.targetLabels.get(message.target_id) ?? null,
    referenceImageId: message.reference_image_id,
    modality: message.modality,
    status: message.status,
    rejectionReason: message.rejection_reason ?? null,
    level: message.status === "rejected" ? "warning" : "info",
    timestamp: message.occurred_at,
  };
}

export function configurationChanged(message: ConfigurationChangedMessage): ConfigurationChangedNotification {
  return {
    kind: "configuration_changed",
    entityKind: message.entity_kind,
    entityId: message.entity_id,
    changeKind: message.change_kind,
    level: "info",
    timestamp: message.occurred_at,
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
