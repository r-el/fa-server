import { ICamera } from "~types/interfaces.js";

export type CameraRole = "admin" | "operator" | "viewer";

export interface CameraAccessSubject {
  id: string;
  role: CameraRole;
}

export function canViewCamera(
  camera: ICamera,
  subject: CameraAccessSubject,
  isAssigned: boolean,
): boolean {
  if (subject.role === "admin") return true;
  if (subject.role === "operator") return camera.created_by === subject.id;
  return isAssigned;
}

export function canManageCamera(camera: ICamera, subject: CameraAccessSubject): boolean {
  return subject.role === "admin" || camera.created_by === subject.id;
}

export function canManageAssignments(
  camera: ICamera,
  subject: CameraAccessSubject,
): boolean {
  return subject.role === "admin" || camera.created_by === subject.id;
}