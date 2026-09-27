import { Router } from "express";
import { CameraController } from "./cameraController.js";
import { LiveController } from "@live/liveController.js";
import { authenticateToken, requireRole } from "@core/middlewares/authMiddleware.js";
import { v } from "@core/middlewares/validateRequest.js";
import {
  assignCameraSchema,
  cameraAssignmentParamsSchema,
  cameraIdSchema,
  createCameraSchema,
  ruleParamsSchema,
  updateCameraSchema,
  zoneParamsSchema,
} from "./cameraSchemas.js";

const router = Router();
const p = { params: cameraIdSchema };

// All camera routes require authentication
router.use(authenticateToken);

// Camera CRUD operations (admin and operator only)
router.post("/", requireRole(["admin", "operator"]), v({ body: createCameraSchema }), CameraController.createCamera);
router.get("/", CameraController.getCameras); // All authenticated users can view cameras they have access to
router.get("/:camera_id", v(p), CameraController.getCameraById);
router.put("/:camera_id", requireRole(["admin", "operator"]), v({ ...p, body: updateCameraSchema }), CameraController.updateCamera);
router.delete("/:camera_id", requireRole("admin"), v(p), CameraController.deleteCamera);
router.post("/:camera_id/start", requireRole(["admin", "operator"]), v(p), CameraController.startCamera);
router.post("/:camera_id/stop", requireRole(["admin", "operator"]), v(p), CameraController.stopCamera);

// Camera assignment operations (admin and operator only)
router.post("/:camera_id/assign", requireRole(["admin", "operator"]), v({ ...p, body: assignCameraSchema }), CameraController.assignCamera);
router.delete("/:camera_id/assign/:user_id", requireRole(["admin", "operator"]), v({ params: cameraAssignmentParamsSchema }), CameraController.removeAssignment);
router.get("/:camera_id/assignments", requireRole(["admin", "operator"]), v(p), CameraController.getCameraAssignments);

// Zones and rules: everyone who sees the camera reads them; operators of the camera change them.
const manage = requireRole(["admin", "operator"]);
router.get("/:camera_id/zones", v(p), CameraController.listZones);
router.post("/:camera_id/zones", manage, v(p), CameraController.createZone);
router.patch("/:camera_id/zones/:zone_id", manage, v({ params: zoneParamsSchema }), CameraController.updateZone);
router.delete("/:camera_id/zones/:zone_id", manage, v({ params: zoneParamsSchema }), CameraController.deleteZone);
router.get("/:camera_id/rules", v(p), CameraController.listRules);
router.post("/:camera_id/rules", manage, v(p), CameraController.createRule);
router.patch("/:camera_id/rules/:rule_id", manage, v({ params: ruleParamsSchema }), CameraController.updateRule);
router.delete("/:camera_id/rules/:rule_id", manage, v({ params: ruleParamsSchema }), CameraController.deleteRule);

// Live video: a JPEG frame, and a ticket for the MSE WebSocket that the upgrade handler relays.
router.get("/:camera_id/live/frame.jpeg", v(p), LiveController.readFrame);
router.post("/:camera_id/live/ticket", v(p), LiveController.issueTicket);

export default router;
