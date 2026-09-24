import { inject, injectable } from "tsyringe";
import {
  AlertQuery,
  AlertRepository,
  AlertSnapshot,
  AlertSummaryQuery,
} from "@alerts/domain/alertRepository.js";
import { SpecterApiError, SpecterHttpClient } from "@specter/specterHttpClient.js";
import { SPECTER_HTTP_CLIENT } from "@specter/tokens.js";
import type { SpecterAlert, SpecterAlertPage, SpecterAlertSummary } from "@specter/specterTypes.js";

@injectable()
export class SpecterAlertRepository implements AlertRepository {
  constructor(@inject(SPECTER_HTTP_CLIENT) private readonly specter: SpecterHttpClient) {}

  private alertPath(alertId: string) {
    return { owner_id: this.specter.ownerId, alert_id: alertId };
  }

  list(query: AlertQuery): Promise<SpecterAlertPage> {
    const { camera_ids, ...filters } = query;
    return this.specter.unwrap(
      this.specter.api.GET("/owners/{owner_id}/alerts", {
        params: {
          path: { owner_id: this.specter.ownerId },
          query: { ...filters, camera_id: camera_ids },
        },
      }),
    );
  }

  summarize(query: AlertSummaryQuery): Promise<SpecterAlertSummary> {
    const { camera_ids, ...filters } = query;
    return this.specter.unwrap(
      this.specter.api.GET("/owners/{owner_id}/alerts/summary", {
        params: {
          path: { owner_id: this.specter.ownerId },
          query: { ...filters, camera_id: camera_ids },
        },
      }),
    );
  }

  async findById(alertId: string): Promise<SpecterAlert | null> {
    try {
      return await this.specter.unwrap(
        this.specter.api.GET("/owners/{owner_id}/alerts/{alert_id}", {
          params: { path: this.alertPath(alertId) },
        }),
      );
    } catch (error) {
      if (error instanceof SpecterApiError && error.specterStatus === 404) return null;
      throw error;
    }
  }

  acknowledge(alertId: string): Promise<SpecterAlert> {
    return this.specter.unwrap(
      this.specter.api.POST("/owners/{owner_id}/alerts/{alert_id}/acknowledge", {
        params: { path: this.alertPath(alertId) },
      }),
    );
  }

  resolve(alertId: string, disposition: "true_positive" | "false_positive", note?: string): Promise<SpecterAlert> {
    return this.specter.unwrap(
      this.specter.api.POST("/owners/{owner_id}/alerts/{alert_id}/resolve", {
        params: { path: this.alertPath(alertId) },
        body: { disposition, note: note ?? null },
      }),
    );
  }

  async readSnapshot(alertId: string): Promise<AlertSnapshot> {
    const response = await this.specter.fetchOwnerResource(`alerts/${alertId}/snapshot`);
    return {
      contentType: response.headers.get("Content-Type") ?? "image/jpeg",
      body: response.body,
    };
  }
}
