/**
 * Notification Types
 *
 * Pure data types for the real-time notification system.
 * These types are internal to Face Alert and do not depend on any
 * external system (Specter, MongoDB, etc.).
 */

// ---------------------------------------------------------------------------
// Notification severity — drives how the client displays the notification
// ---------------------------------------------------------------------------

export type NotificationLevel = "critical" | "warning" | "info";

// ---------------------------------------------------------------------------
// Notification payloads — each notification kind has its own shape
// ---------------------------------------------------------------------------

export interface UnauthorizedPersonNotification {
  readonly kind: "unauthorized_person";
  readonly cameraId: string;
  readonly cameraName: string;
  readonly personId: string;
  readonly confidence: number;
  readonly level: NotificationLevel;
  readonly snapshotUrl: string | null;
  readonly timestamp: string; // ISO 8601
}

export interface CameraStatusNotification {
  readonly kind: "camera_status";
  readonly cameraId: string;
  readonly cameraName: string;
  readonly status: "online" | "offline" | "error";
  readonly message: string | null;
  readonly level: NotificationLevel;
  readonly timestamp: string;
}

export interface SystemNotification {
  readonly kind: "system";
  readonly message: string;
  readonly level: NotificationLevel;
  readonly timestamp: string;
}

/**
 * Union of every notification the server can push.
 * Adding a new notification kind = adding a new member here + a handler.
 */
export type Notification =
  | UnauthorizedPersonNotification
  | CameraStatusNotification
  | SystemNotification;

// ---------------------------------------------------------------------------
// Socket.IO event map — typed contract between server and client
// ---------------------------------------------------------------------------

/** Events the server emits to clients. */
export interface ServerToClientEvents {
  notification: (payload: Notification) => void;
  "camera:subscribed": (cameraIds: string[]) => void;
  error: (payload: { message: string }) => void;
}

/** Events the client can emit to the server. */
export interface ClientToServerEvents {
  "subscribe:cameras": (cameraIds: string[]) => void;
  "unsubscribe:cameras": (cameraIds: string[]) => void;
}

/** Internal server-side socket data attached to each connection. */
export interface SocketData {
  userId: string;
  username: string;
  role: string;
}
