import { describe, expect, it } from "vitest";
import {
  canManageAssignments,
  canManageCamera,
  canViewCamera,
} from "@cameras/domain/cameraAccess.js";

const camera = { id: "camera-1", camera_id: "front", name: "Front", connection_string: "rtsp://front", created_by: "operator-1" };

describe("camera access policy", () => {
  it("lets admins view and manage every camera", () => {
    const admin = { id: "admin-1", role: "admin" as const };

    expect(canViewCamera(camera, admin, false)).toBe(true);
    expect(canManageCamera(camera, admin)).toBe(true);
    expect(canManageAssignments(camera, admin)).toBe(true);
  });

  it("limits operators to cameras they created", () => {
    const owner = { id: "operator-1", role: "operator" as const };
    const otherOperator = { id: "operator-2", role: "operator" as const };

    expect(canViewCamera(camera, owner, false)).toBe(true);
    expect(canViewCamera(camera, otherOperator, true)).toBe(false);
    expect(canManageCamera(camera, owner)).toBe(true);
    expect(canManageAssignments(camera, otherOperator)).toBe(false);
  });

  it("limits viewers to explicitly assigned cameras", () => {
    const viewer = { id: "viewer-1", role: "viewer" as const };

    expect(canViewCamera(camera, viewer, true)).toBe(true);
    expect(canViewCamera(camera, viewer, false)).toBe(false);
    expect(canManageCamera(camera, viewer)).toBe(false);
  });
});