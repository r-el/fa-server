import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type { ValidateFunction } from "ajv";
import { specterEventSchemas } from "./generated/eventSchemas.js";
import type {
  CameraStatusChangedMessage,
  ConfigurationChangedMessage,
  EnrollmentStatusChangedMessage,
  MatchConfirmedMessage,
  RuleTriggeredMessage,
} from "./generated/events.js";

// fa understands every 1.x message; a new major version may change meanings, so it is refused.
const SUPPORTED_SCHEMA_MAJOR_VERSION = "1";
const DEFAULT_SCHEMA_VERSION = "1.0";
const CAMERA_SUBJECT_PATTERN =
  /^specter\.owners\.([^.]+)\.cameras\.([^.]+)\.(match_confirmed|rule_triggered|status_changed)$/;
const OWNER_SUBJECT_PATTERN =
  /^specter\.owners\.([^.]+)\.(enrollment\.status_changed|configuration\.changed)$/;

export type SpecterEvent =
  | { kind: "match_confirmed"; message: MatchConfirmedMessage }
  | { kind: "rule_triggered"; message: RuleTriggeredMessage }
  | { kind: "camera_status_changed"; message: CameraStatusChangedMessage }
  | { kind: "enrollment_status_changed"; message: EnrollmentStatusChangedMessage }
  | { kind: "configuration_changed"; message: ConfigurationChangedMessage };

export type SpecterEventKind = SpecterEvent["kind"];

export class InvalidSpecterEventError extends Error {
  constructor(subject: string, reason: string) {
    super(`invalid Specter event on ${subject}: ${reason}`);
    this.name = "InvalidSpecterEventError";
  }
}

const KIND_BY_SUBJECT_EVENT: Record<string, SpecterEventKind> = {
  match_confirmed: "match_confirmed",
  rule_triggered: "rule_triggered",
  status_changed: "camera_status_changed",
  "enrollment.status_changed": "enrollment_status_changed",
  "configuration.changed": "configuration_changed",
};

// Fields added by a newer 1.x Specter are dropped instead of failing validation.
const ajv = new Ajv2020.default({ allErrors: false, removeAdditional: true, strict: false });
addFormats.default(ajv);
const validatorsByKind = Object.fromEntries(
  Object.entries(specterEventSchemas).map(([kind, schema]) => [kind, ajv.compile(schema as object)]),
) as Record<SpecterEventKind, ValidateFunction>;

function kindOfSubject(subject: string): SpecterEventKind | null {
  const subjectEvent =
    CAMERA_SUBJECT_PATTERN.exec(subject)?.[3] ?? OWNER_SUBJECT_PATTERN.exec(subject)?.[2];
  return subjectEvent === undefined ? null : KIND_BY_SUBJECT_EVENT[subjectEvent];
}

/** Checks a NATS message against Specter's contract and returns it typed by its subject. */
export function parseSpecterEvent(subject: string, payload: unknown): SpecterEvent {
  const kind = kindOfSubject(subject);
  if (kind === null) throw new InvalidSpecterEventError(subject, "unknown subject");
  const schemaVersion = (payload as { schema_version?: unknown })?.schema_version ?? DEFAULT_SCHEMA_VERSION;
  if (typeof schemaVersion !== "string" || schemaVersion.split(".")[0] !== SUPPORTED_SCHEMA_MAJOR_VERSION) {
    throw new InvalidSpecterEventError(subject, `unsupported schema_version ${String(schemaVersion)}`);
  }
  const validate = validatorsByKind[kind];
  if (!validate(payload)) {
    throw new InvalidSpecterEventError(subject, ajv.errorsText(validate.errors));
  }
  return { kind, message: payload } as SpecterEvent;
}
