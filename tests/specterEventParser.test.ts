import { describe, expect, it } from "vitest";
import { InvalidSpecterEventError, parseSpecterEvent } from "@specter/specterEventParser.js";

const OWNER_SUBJECT = "specter.owners.facealert";
const CAMERA_ID = `camera_${"b".repeat(32)}`;

const statusMessage = {
  schema_version: "1.0",
  message_id: "message_1",
  occurred_at: "2026-09-24T10:00:00Z",
  owner_id: "facealert",
  camera_id: CAMERA_ID,
  status: "running",
};

describe("parseSpecterEvent", () => {
  it("types a camera status by its subject", () => {
    const event = parseSpecterEvent(`${OWNER_SUBJECT}.cameras.${CAMERA_ID}.status_changed`, {
      ...statusMessage,
    });

    expect(event.kind).toBe("camera_status_changed");
    expect(event.message).toMatchObject({ camera_id: CAMERA_ID, status: "running" });
  });

  it("tells an enrollment status from a camera status", () => {
    const event = parseSpecterEvent(`${OWNER_SUBJECT}.enrollment.status_changed`, {
      occurred_at: "2026-09-24T10:00:00Z",
      owner_id: "facealert",
      target_id: "target_1",
      reference_image_id: "image_1",
      modality: "face",
      status: "embedded",
    });

    expect(event.kind).toBe("enrollment_status_changed");
  });

  it("drops fields added by a newer 1.x Specter", () => {
    const event = parseSpecterEvent(`${OWNER_SUBJECT}.cameras.${CAMERA_ID}.status_changed`, {
      ...statusMessage,
      schema_version: "1.3",
      added_later: true,
    });

    expect(event.message).not.toHaveProperty("added_later");
  });

  it.each([
    ["an unknown subject", "specter.detector.requests", statusMessage],
    ["a new major version", `${OWNER_SUBJECT}.cameras.${CAMERA_ID}.status_changed`, { ...statusMessage, schema_version: "2.0" }],
    ["an invalid status", `${OWNER_SUBJECT}.cameras.${CAMERA_ID}.status_changed`, { ...statusMessage, status: "exploded" }],
  ])("refuses %s", (_, subject, payload) => {
    expect(() => parseSpecterEvent(subject, { ...payload })).toThrow(InvalidSpecterEventError);
  });
});
