/**
 * Notification Usage Examples
 *
 * Shows how any part of the application can send real-time
 * notifications without knowing anything about Socket.IO.
 *
 * These examples are NOT meant to be imported — they exist as
 * documentation for developers working on the project.
 */

// ──────────────────────────────────────────────────────────────
// Example 1: Send an "unauthorized person" alert to a camera
// ──────────────────────────────────────────────────────────────

/*
import { getNotificationDispatcher, NotificationFactory } from "@notifications/index.js";

// Somewhere in your event processing pipeline…
function handleDetectionEvent(event: SomeDetectionEvent) {
  const dispatcher = getNotificationDispatcher();

  const notification = NotificationFactory.unauthorizedPerson({
    cameraId: event.camera_id,
    cameraName: "Lobby Camera",      // resolve from your camera DB
    personId: event.person_id,
    confidence: event.confidence,
    snapshotUrl: event.image_url,
  });

  // This sends to ALL users subscribed to camera `event.camera_id`
  dispatcher.toCamera(event.camera_id, notification);
}
*/

// ──────────────────────────────────────────────────────────────
// Example 2: Broadcast a system-wide notification
// ──────────────────────────────────────────────────────────────

/*
import { getNotificationDispatcher, NotificationFactory } from "@notifications/index.js";

function notifyMaintenanceWindow() {
  const dispatcher = getNotificationDispatcher();

  dispatcher.broadcast(
    NotificationFactory.system("Scheduled maintenance in 10 minutes", "warning")
  );
}
*/

// ──────────────────────────────────────────────────────────────
// Example 3: Camera status change
// ──────────────────────────────────────────────────────────────

/*
import { getNotificationDispatcher, NotificationFactory } from "@notifications/index.js";

function handleCameraOffline(cameraId: string, cameraName: string) {
  const dispatcher = getNotificationDispatcher();

  dispatcher.toCamera(
    cameraId,
    NotificationFactory.cameraStatus({
      cameraId,
      cameraName,
      status: "offline",
      message: "Camera lost connection",
    })
  );
}
*/

// ──────────────────────────────────────────────────────────────
// Example 4: Client-side (React) — connect after login
// ──────────────────────────────────────────────────────────────

/*
// In your React app (client side):

import { io, Socket } from "socket.io-client";

function connectToNotifications(token: string) {
  const socket = io("http://localhost:3000", {
    auth: { token: `Bearer ${token}` },
    transports: ["websocket"],
  });

  socket.on("connect", () => {
    console.log("Connected to notification server");
  });

  socket.on("notification", (payload) => {
    // payload is fully typed as Notification
    switch (payload.kind) {
      case "unauthorized_person":
        showBrowserNotification(
          `⚠ Person detected on ${payload.cameraName}`,
          `Confidence: ${(payload.confidence * 100).toFixed(0)}%`
        );
        break;
      case "camera_status":
        toast.info(`Camera ${payload.cameraName} is ${payload.status}`);
        break;
      case "system":
        toast[payload.level](payload.message);
        break;
    }
  });

  socket.on("camera:subscribed", (cameraIds) => {
    console.log("Subscribed to cameras:", cameraIds);
  });

  socket.on("disconnect", (reason) => {
    console.log("Disconnected:", reason);
  });

  return socket;
}

// Request browser notification permissions on first login
async function showBrowserNotification(title: string, body: string) {
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}
*/

export {};
