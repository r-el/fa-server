import type {
  SpecterAlert,
  SpecterAlertPage,
  SpecterAlertSummary,
  SpecterDisposition,
} from "@specter/specterTypes.js";

export interface AlertQuery {
  // undefined means every camera; an empty list matches nothing.
  camera_ids?: string[];
  kind?: "identity_match" | "rule";
  disposition?: SpecterDisposition;
  created_since?: string;
  created_until?: string;
  cursor?: string;
  limit: number;
}

export type AlertSummaryQuery = Pick<AlertQuery, "camera_ids" | "created_since" | "created_until">;

export interface AlertSnapshot {
  contentType: string;
  body: ReadableStream<Uint8Array>;
}

/** Alerts, their reviews and snapshots are kept by Specter; fa never stores a copy. */
export interface AlertRepository {
  list(query: AlertQuery): Promise<SpecterAlertPage>;
  summarize(query: AlertSummaryQuery): Promise<SpecterAlertSummary>;
  // null when the alert does not exist, which also happens briefly right after its event.
  findById(alertId: string): Promise<SpecterAlert | null>;
  acknowledge(alertId: string): Promise<SpecterAlert>;
  resolve(alertId: string, disposition: "true_positive" | "false_positive", note?: string): Promise<SpecterAlert>;
  readSnapshot(alertId: string): Promise<AlertSnapshot>;
}
