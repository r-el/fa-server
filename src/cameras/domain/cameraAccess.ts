import { ICamera } from "~types/interfaces.js";

export type CameraRole = "admin" | "operator" | "viewer";

export interface CameraAccessSubject {
  id: string;
  role: CameraRole;
}

function isOperatorOfCamera(camera: ICamera, subject: CameraAccessSubject, isAssigned: boolean): boolean {
  return subject.role === "operator" && (camera.created_by === subject.id || isAssigned);
}

/** Admins see every camera, operators the ones they created or were assigned, viewers assigned ones. */
export function canViewCamera(
  camera: ICamera,
  subject: CameraAccessSubject,
  isAssigned: boolean,
): boolean {
  if (subject.role === "admin") return true;
  return isOperatorOfCamera(camera, subject, isAssigned) || (subject.role === "viewer" && isAssigned);
}

/** Changing a camera, its zones and rules, or starting it; viewers never do. */
export function canManageCamera(
  camera: ICamera,
  subject: CameraAccessSubject,
  isAssigned: boolean,
): boolean {
  return subject.role === "admin" || isOperatorOfCamera(camera, subject, isAssigned);
}

/** Only the camera's creator hands out access to it, besides admins. */
export function canManageAssignments(
  camera: ICamera,
  subject: CameraAccessSubject,
): boolean {
  return subject.role === "admin" || (subject.role === "operator" && camera.created_by === subject.id);
}