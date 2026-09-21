import { ICamera, ICameraAssignment } from "~types/interfaces.js";

export interface CameraRepository {
  create(cameraData: ICamera): Promise<ICamera>;
  findById(cameraId: string): Promise<ICamera>;
  findAll(): Promise<ICamera[]>;
  findCreatedBy(userId: string): Promise<ICamera[]>;
  findAssignedTo(userId: string): Promise<ICamera[]>;
  isAssigned(cameraId: string, userId: string): Promise<boolean>;
  assignToUser(assignmentData: ICameraAssignment): Promise<ICameraAssignment>;
  removeAssignment(cameraId: string, userId: string): Promise<boolean>;
  getAssignments(cameraId: string): Promise<ICameraAssignment[]>;
  update(cameraId: string, updateData: Partial<ICamera>): Promise<ICamera>;
  delete(cameraId: string): Promise<boolean>;
}