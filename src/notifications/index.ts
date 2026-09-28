/**
 * Notification Module — Public API
 *
 * Re-exports the pieces that the rest of the application needs.
 * Import from `@notifications/index.js` (or just `@notifications`)
 * and nothing else.
 */

export { initializeSocketServer, getNotificationDispatcher } from "./socketServer.js";
export { NotificationDispatcher } from "./notificationDispatcher.js";
export * as NotificationFactory from "./notificationFactory.js";
export type {
  Notification,
  NotificationLevel,
  AlertNotification,
  CameraStatusNotification,
  EnrollmentNotification,
  ConfigurationChangedNotification,
  SystemNotification,
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "./types.js";
