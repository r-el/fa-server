import { Response } from "express";
import { TypedRequest } from "~types/request.js";
import { container } from "@core/di.js";
import { catchAsync } from "@core/middlewares/errorHandler.js";
import { validate } from "@core/validationService.js";
import { CameraService } from "./cameraService.js";
import { CameraSettingsService } from "./cameraSettingsService.js";
import {
  assignCameraSchema,
  cameraAssignmentParamsSchema,
  cameraIdSchema,
  createCameraSchema,
  ruleParamsSchema,
  updateCameraSchema,
  zoneParamsSchema,
} from "./cameraSchemas.js";

const cameraService = () => container.resolve(CameraService);
const settingsService = () => container.resolve(CameraSettingsService);

export class CameraController {
  static createCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const body = validate(req.body, createCameraSchema);
    const camera = await cameraService().createCamera(body, req.user);
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
    const { camera_id } = validate(req.params, cameraIdSchema);
    const camera = await cameraService().getAccessibleCamera(camera_id, req.user);
    res.json({ success: true, message: "Camera retrieved successfully", data: camera });
  });

  static updateCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    const body = validate(req.body, updateCameraSchema);
    const camera = await cameraService().updateCamera(camera_id, body, req.user);
    res.json({ success: true, message: "Camera updated successfully", data: camera });
  });

  static deleteCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    await cameraService().deleteCamera(camera_id, req.user);
    res.json({ success: true, message: "Camera deleted successfully" });
  });

  // Specter only records the request; the camera's live_status follows over Socket.IO.
  static startCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    const camera = await cameraService().startCamera(camera_id, req.user);
    res.status(202).json({ success: true, message: "Camera start requested", data: camera });
  });

  static stopCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    const camera = await cameraService().stopCamera(camera_id, req.user);
    res.status(202).json({ success: true, message: "Camera stop requested", data: camera });
  });

  static assignCamera = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    const { user_id } = validate(req.body, assignCameraSchema);
    const assignment = await cameraService().assignCameraToUser(camera_id, user_id, req.user);
    res.status(201).json({ success: true, message: "Camera assigned successfully", data: assignment });
  });

  static removeAssignment = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id, user_id } = validate(req.params, cameraAssignmentParamsSchema);
    await cameraService().removeCameraAssignment(camera_id, user_id, req.user);
    res.json({ success: true, message: "Camera assignment removed successfully" });
  });

  static getCameraAssignments = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    const assignments = await cameraService().getCameraAssignments(camera_id, req.user);
    res.json({ success: true, message: "Camera assignments retrieved successfully", data: assignments });
  });

  static listZones = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    res.json({ success: true, data: await settingsService().listZones(camera_id, req.user) });
  });

  static createZone = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    res.status(201).json({ success: true, data: await settingsService().createZone(camera_id, req.body, req.user) });
  });

  static updateZone = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id, zone_id } = validate(req.params, zoneParamsSchema);
    res.json({ success: true, data: await settingsService().updateZone(camera_id, zone_id, req.body, req.user) });
  });

  static deleteZone = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id, zone_id } = validate(req.params, zoneParamsSchema);
    await settingsService().deleteZone(camera_id, zone_id, req.user);
    res.json({ success: true, message: "Zone deleted successfully" });
  });

  static listRules = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    res.json({ success: true, data: await settingsService().listRules(camera_id, req.user) });
  });

  static createRule = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    res.status(201).json({ success: true, data: await settingsService().createRule(camera_id, req.body, req.user) });
  });

  static updateRule = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id, rule_id } = validate(req.params, ruleParamsSchema);
    res.json({ success: true, data: await settingsService().updateRule(camera_id, rule_id, req.body, req.user) });
  });

  static deleteRule = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id, rule_id } = validate(req.params, ruleParamsSchema);
    await settingsService().deleteRule(camera_id, rule_id, req.user);
    res.json({ success: true, message: "Rule deleted successfully" });
  });
}
