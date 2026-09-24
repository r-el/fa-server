import type { components } from "./generated/openapi.js";

type Schemas = components["schemas"];

export type SpecterCamera = Schemas["CameraResponse"];
export type SpecterCameraCreate = Schemas["CameraCreateBody"];
export type SpecterCameraUpdate = Schemas["CameraUpdateBody"];
export type SpecterCameraStatus = Schemas["CameraStatus"];
export type SpecterZone = Schemas["ZoneResponse"];
export type SpecterRule = Schemas["RuleResponse"];
export type SpecterWatchlist = Schemas["WatchlistResponse"];
export type SpecterTarget = Schemas["TargetResponse"];
export type SpecterAlert = Schemas["AlertResponse"];
export type SpecterAlertPage = Schemas["AlertPageResponse"];
export type SpecterAlertSummary = Schemas["AlertSummaryResponse"];
export type SpecterDisposition = Schemas["Disposition"];
