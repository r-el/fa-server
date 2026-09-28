import { describe, expect, it } from "vitest";
import {
  canManageAssignments,
  canManageCamera,
  canViewCamera,
} from "@cameras/domain/cameraAccess.js";

const camera = {
  id: `camera_${"c".repeat(32)}`,
  name: "Front",
  source_url: "rtsp://front",
  username: null,
  has_password: false,
  location: null,
  created_by: "operator-1",
  watchlist_ids: [],
  detection_classes: [],
  is_enabled: true,
  desired_state: "stopped" as const,
  live_status: null,
};

describe("camera access policy", () => {
  it("lets admins view and manage every camera", () => {
    const admin = { id: "admin-1", role: "admin" as const };

    expect(canViewCamera(camera, admin, false)).toBe(true);
    expect(canManageCamera(camera, admin, false)).toBe(true);
    expect(canManageAssignments(camera, admin)).toBe(true);
  });

  it("limits operators to cameras they created or were assigned", () => {
    const creator = { id: "operator-1", role: "operator" as const };
    const otherOperator = { id: "operator-2", role: "operator" as const };

    expect(canViewCamera(camera, creator, false)).toBe(true);
    expect(canViewCamera(camera, otherOperator, false)).toBe(false);
    expect(canManageCamera(camera, otherOperator, true)).toBe(true);
    expect(canManageAssignments(camera, creator)).toBe(true);
    expect(canManageAssignments(camera, otherOperator)).toBe(false);
  });

  it("lets viewers only see assigned cameras", () => {
    const viewer = { id: "viewer-1", role: "viewer" as const };

    expect(canViewCamera(camera, viewer, true)).toBe(true);
    expect(canViewCamera(camera, viewer, false)).toBe(false);
    expect(canManageCamera(camera, viewer, true)).toBe(false);
  });
});