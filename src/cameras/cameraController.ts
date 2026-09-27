import { Response } from "express";
import { TypedRequest } from "~types/request.js";
import { container } from "@core/di.js";
import { catchAsync } from "@core/middlewares/errorHandler.js";
import { CameraService } from "./cameraService.js";
import { CameraSettingsService } from "./cameraSettingsService.js";

const cameraService = () => container.resolve(CameraService);
const settingsService = () => container.resolve(CameraSettingsService);

export class CameraController {
  static createCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const camera = await cameraService().createCamera(req.body, req.user);
    res.status(201).json({ success: true, message: "Camera created successfully", data: camera });
  });

  static getCameras = catchAsync(async (req: TypedRequest, res: Response) => {
    const cameras = await cameraService().listAccessibleCameras(req.user);
    res.json({
      success: true,
      message: "Cameras retrieved successfully",
      data: cameras,
      total: cameras.length,
    });
  });

  static getCameraById = catchAsync(async (req: TypedRequest, res: Response) => {
    const camera = await cameraService().getAccessibleCamera(req.params.camera_id, req.user);
    res.json({ success: true, message: "Camera retrieved successfully", data: camera });
  });

  static updateCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const camera = await cameraService().updateCamera(req.params.camera_id, req.body, req.user);
    res.json({ success: true, message: "Camera updated successfully", data: camera });
  });

  static deleteCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    await cameraService().deleteCamera(req.params.camera_id, req.user);
    res.json({ success: true, message: "Camera deleted successfully" });
  });

  // Specter only records the request; the camera's live_status follows over Socket.IO.
  static startCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const camera = await cameraService().startCamera(req.params.camera_id, req.user);
    res.status(202).json({ success: true, message: "Camera start requested", data: camera });
  });

  static stopCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const camera = await cameraService().stopCamera(req.params.camera_id, req.user);
    res.status(202).json({ success: true, message: "Camera stop requested", data: camera });
  });

  static assignCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const assignment = await cameraService().assignCameraToUser(req.params.camera_id, req.body.user_id, req.user);
    res.status(201).json({ success: true, message: "Camera assigned successfully", data: assignment });
  });

  static removeAssignment = catchAsync(async (req: TypedRequest, res: Response) => {
    await cameraService().removeCameraAssignment(req.params.camera_id, req.params.user_id, req.user);
    res.json({ success: true, message: "Camera assignment removed successfully" });
  });

  static getCameraAssignments = catchAsync(async (req: TypedRequest, res: Response) => {
    const assignments = await cameraService().getCameraAssignments(req.params.camera_id, req.user);
    res.json({ success: true, message: "Camera assignments retrieved successfully", data: assignments });
  });

  static listZones = catchAsync(async (req: TypedRequest, res: Response) => {
    res.json({ success: true, data: await settingsService().listZones(req.params.camera_id, req.user) });
  });

  static createZone = catchAsync(async (req: TypedRequest, res: Response) => {
    res.status(201).json({ success: true, data: await settingsService().createZone(req.params.camera_id, req.body, req.user) });
  });

  static updateZone = catchAsync(async (req: TypedRequest, res: Response) => {
    res.json({ success: true, data: await settingsService().updateZone(req.params.camera_id, req.params.zone_id, req.body, req.user) });
  });

  static deleteZone = catchAsync(async (req: TypedRequest, res: Response) => {
    await settingsService().deleteZone(req.params.camera_id, req.params.zone_id, req.user);
    res.json({ success: true, message: "Zone deleted successfully" });
  });

  static listRules = catchAsync(async (req: TypedRequest, res: Response) => {
    res.json({ success: true, data: await settingsService().listRules(req.params.camera_id, req.user) });
  });

  static createRule = catchAsync(async (req: TypedRequest, res: Response) => {
    res.status(201).json({ success: true, data: await settingsService().createRule(req.params.camera_id, req.body, req.user) });
  });

  static updateRule = catchAsync(async (req: TypedRequest, res: Response) => {
    res.json({ success: true, data: await settingsService().updateRule(req.params.camera_id, req.params.rule_id, req.body, req.user) });
  });

  static deleteRule = catchAsync(async (req: TypedRequest, res: Response) => {
    await settingsService().deleteRule(req.params.camera_id, req.params.rule_id, req.user);
    res.json({ success: true, message: "Rule deleted successfully" });
  });
}
