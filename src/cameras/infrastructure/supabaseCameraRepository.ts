import { injectable } from "tsyringe";
import { Camera } from "@cameras/cameraModel.js";
import { CameraRepository } from "@cameras/domain/cameraRepository.js";
import { ICamera, ICameraAssignment } from "~types/interfaces.js";

@injectable()
export class SupabaseCameraRepository implements CameraRepository {
  create(cameraData: ICamera): Promise<ICamera> {
    return Camera.create(cameraData);
  }

  findById(cameraId: string): Promise<ICamera> {
    return Camera.getById(cameraId);
  }

  findAll(): Promise<ICamera[]> {
    return Camera.getAllCameras();
  }

  findCreatedBy(userId: string): Promise<ICamera[]> {
    return Camera.getCreatedCamerasByUserId(userId);
  }

  findAssignedTo(userId: string): Promise<ICamera[]> {
    return Camera.getAssignedCamerasByUserId(userId);
  }

  isAssigned(cameraId: string, userId: string): Promise<boolean> {
    return Camera.isAssigned(cameraId, userId);
  }

  assignToUser(assignmentData: ICameraAssignment): Promise<ICameraAssignment> {
    return Camera.assignToUser(assignmentData);
  }

  removeAssignment(cameraId: string, userId: string): Promise<boolean> {
    return Camera.removeAssignment(cameraId, userId);
  }

  getAssignments(cameraId: string): Promise<ICameraAssignment[]> {
    return Camera.getAssignments(cameraId);
  }

  update(cameraId: string, updateData: Partial<ICamera>): Promise<ICamera> {
    return Camera.update(cameraId, updateData);
  }

  delete(cameraId: string): Promise<boolean> {
    return Camera.delete(cameraId);
  }
}