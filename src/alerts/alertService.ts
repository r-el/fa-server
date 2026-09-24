import { inject, injectable } from "tsyringe";
import { ALERT_REPOSITORY } from "@alerts/infrastructure/tokens.js";
import type {
  AlertQuery,
  AlertRepository,
  AlertSnapshot,
  AlertSummaryQuery,
} from "@alerts/domain/alertRepository.js";
import { CameraService, CameraUser } from "@cameras/cameraService.js";
import { ApiError } from "@core/middlewares/errorHandler.js";
import logger from "@core/utils/logger.js";
import { SPECTER_CATALOG } from "@specter/tokens.js";
import type { CatalogSnapshot, SpecterCatalog } from "@specter/specterCatalog.js";
import type { SpecterAlert, SpecterAlertSummary } from "@specter/specterTypes.js";

export interface EnrichedAlert extends SpecterAlert {
  camera_name: string | null;
  watchlist_name: string | null;
  watchlist_kind: string | null;
  target_label: string | null;
  // fa's own URL, which checks the user's access before streaming the image.
  snapshot_url: string | null;
}

export interface AlertPage {
  alerts: EnrichedAlert[];
  next_cursor: string | null;
}

const EMPTY_CATALOG: CatalogSnapshot = {
  cameraNames: new Map(),
  watchlists: new Map(),
  targetLabels: new Map(),
};

@injectable()
export class AlertService {
  constructor(
    @inject(ALERT_REPOSITORY) private readonly alertRepository: AlertRepository,
    @inject(CameraService) private readonly cameraService: CameraService,
    @inject(SPECTER_CATALOG) private readonly catalog: SpecterCatalog,
  ) {}

  async listAlerts(query: AlertQuery, user: CameraUser): Promise<AlertPage> {
    const cameraIds = await this.restrictToAccessibleCameras(query.camera_ids, user);
    if (cameraIds?.length === 0) return { alerts: [], next_cursor: null };
    const page = await this.alertRepository.list({ ...query, camera_ids: cameraIds });
    const catalog = await this.readCatalog();
    return {
      alerts: page.alerts.map((alert) => this.enrich(alert, catalog)),
      next_cursor: page.next_cursor ?? null,
    };
  }

  async summarizeAlerts(query: AlertSummaryQuery, user: CameraUser): Promise<SpecterAlertSummary> {
    const cameraIds = await this.restrictToAccessibleCameras(query.camera_ids, user);
    if (cameraIds?.length === 0) {
      return { total_count: 0, unacknowledged_count: 0, counts: [], daily_counts: [] };
    }
    return this.alertRepository.summarize({ ...query, camera_ids: cameraIds });
  }

  async getAlert(alertId: string, user: CameraUser): Promise<EnrichedAlert> {
    return this.enrich(await this.getAccessibleAlert(alertId, user), await this.readCatalog());
  }

  async acknowledgeAlert(alertId: string, user: CameraUser): Promise<EnrichedAlert> {
    await this.getAccessibleAlert(alertId, user);
    return this.enrich(await this.alertRepository.acknowledge(alertId), await this.readCatalog());
  }

  async resolveAlert(
    alertId: string,
    disposition: "true_positive" | "false_positive",
    note: string | undefined,
    user: CameraUser,
  ): Promise<EnrichedAlert> {
    if (!["operator", "admin"].includes(user.role)) {
      throw new ApiError(403, "Only operators and admins can resolve alerts");
    }
    await this.getAccessibleAlert(alertId, user);
    const alert = await this.alertRepository.resolve(alertId, disposition, note);
    return this.enrich(alert, await this.readCatalog());
  }

  async readSnapshot(alertId: string, user: CameraUser): Promise<AlertSnapshot> {
    await this.getAccessibleAlert(alertId, user);
    return this.alertRepository.readSnapshot(alertId);
  }

  private async getAccessibleAlert(alertId: string, user: CameraUser): Promise<SpecterAlert> {
    const alert = await this.alertRepository.findById(alertId);
    const accessibleIds = alert === null ? null : await this.cameraService.accessibleCameraIds(user);
    if (alert === null || (accessibleIds !== "all" && !accessibleIds.has(alert.camera_id))) {
      throw new ApiError(404, "Alert not found");
    }
    return alert;
  }

  /** The requested cameras the user may see, or all the user may see when none are requested. */
  private async restrictToAccessibleCameras(
    requestedIds: string[] | undefined,
    user: CameraUser,
  ): Promise<string[] | undefined> {
    const accessibleIds = await this.cameraService.accessibleCameraIds(user);
    if (accessibleIds === "all") return requestedIds;
    if (requestedIds === undefined) return [...accessibleIds];
    return requestedIds.filter((cameraId) => accessibleIds.has(cameraId));
  }

  private async readCatalog(): Promise<CatalogSnapshot> {
    try {
      return await this.catalog.read();
    } catch (error) {
      // Names only decorate alerts, so alerts are still served without them.
      logger.warn("Cannot read Specter names for alerts", { error: error.message });
      return EMPTY_CATALOG;
    }
  }

  private enrich(alert: SpecterAlert, catalog: CatalogSnapshot): EnrichedAlert {
    const watchlist = alert.watchlist_id ? catalog.watchlists.get(alert.watchlist_id) : undefined;
    return {
      ...alert,
      camera_name: catalog.cameraNames.get(alert.camera_id) ?? null,
      watchlist_name: watchlist?.name ?? null,
      watchlist_kind: watchlist?.kind ?? null,
      target_label: alert.target_id ? catalog.targetLabels.get(alert.target_id) ?? null : null,
      snapshot_url: alert.has_snapshot ? `/api/alerts/${alert.id}/snapshot` : null,
    };
  }
}
