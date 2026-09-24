import { ICamera, ICameraAssignment, ICameraChanges, ICameraCreate } from "~types/interfaces.js";

/** Cameras live in Specter; this port hides how fa's fields are kept there. */
export interface CameraRepository {
  create(camera: ICameraCreate): Promise<ICamera>;
  // null when the camera does not exist.
  findById(cameraId: string): Promise<ICamera | null>;
  findAll(): Promise<ICamera[]>;
  update(cameraId: string, changes: ICameraChanges): Promise<ICamera>;
  delete(cameraId: string): Promise<void>;
  start(cameraId: string): Promise<ICamera>;
  stop(cameraId: string): Promise<ICamera>;
}

/** Which users may see which cameras; kept by fa, keyed by the Specter camera id. */
export interface CameraAssignmentRepository {
  findCameraIdsAssignedTo(userId: string): Promise<string[]>;
  isAssigned(cameraId: string, userId: string): Promise<boolean>;
  assign(assignment: ICameraAssignment): Promise<ICameraAssignment>;
  remove(cameraId: string, userId: string): Promise<void>;
  removeAllForCamera(cameraId: string): Promise<void>;
  listForCamera(cameraId: string): Promise<ICameraAssignment[]>;
}