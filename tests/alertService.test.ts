import { describe, expect, it } from "vitest";
import { AlertService } from "@alerts/alertService.js";
import type { AlertQuery, AlertRepository } from "@alerts/domain/alertRepository.js";
import type { CameraService } from "@cameras/cameraService.js";
import type { SpecterCatalog } from "@specter/specterCatalog.js";

const cameraId = (letter: string) => `camera_${letter.repeat(32)}`;
const ALERT_ID = `message_${"d".repeat(32)}`;

function buildService(accessibleIds: "all" | string[], alertCameraId = cameraId("a")) {
  const listQueries: AlertQuery[] = [];
  const alertRepository = {
    list: async (query) => {
      listQueries.push(query);
      return { alerts: [], next_cursor: null };
    },
    findById: async (id) =>
      id === ALERT_ID ? ({ id, camera_id: alertCameraId, has_snapshot: true } as any) : null,
    acknowledge: async (id) => ({ id, camera_id: alertCameraId, has_snapshot: true }) as any,
  } as Partial<AlertRepository> as AlertRepository;
  const cameraService = {
    accessibleCameraIds: async () => (accessibleIds === "all" ? "all" : new Set(accessibleIds)),
  } as Partial<CameraService> as CameraService;
  const catalog = {
    read: async () => ({
      cameraNames: new Map([[cameraId("a"), "Gate"]]),
      watchlists: new Map(),
      targetLabels: new Map(),
    }),
  } as Partial<SpecterCatalog> as SpecterCatalog;
  return { service: new AlertService(alertRepository, cameraService, catalog), listQueries };
}

const viewer = { id: "viewer-1", role: "viewer" };

describe("AlertService", () => {
  it("asks Specter only for the requested cameras the user may see", async () => {
    const { service, listQueries } = buildService([cameraId("a"), cameraId("b")]);

    await service.listAlerts({ camera_ids: [cameraId("b"), cameraId("c")], limit: 50 }, viewer);

    expect(listQueries.map((query) => query.camera_ids)).toEqual([[cameraId("b")]]);
  });

  it("does not ask Specter when the user may see no camera", async () => {
    const { service, listQueries } = buildService([]);

    const page = await service.listAlerts({ limit: 50 }, viewer);

    expect(page).toEqual({ alerts: [], next_cursor: null });
    expect(listQueries).toEqual([]);
  });

  it("answers 404 for an alert of a camera the user may not see", async () => {
    const { service } = buildService([cameraId("b")]);

    await expect(service.getAlert(ALERT_ID, viewer)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("lets a viewer acknowledge but not resolve", async () => {
    const { service } = buildService([cameraId("a")]);

    const acknowledged = await service.acknowledgeAlert(ALERT_ID, viewer);

    expect(acknowledged).toMatchObject({
      camera_name: "Gate",
      snapshot_url: `/api/alerts/${ALERT_ID}/snapshot`,
    });
    await expect(service.resolveAlert(ALERT_ID, "false_positive", undefined, viewer)).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
