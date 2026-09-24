import { Router } from "express";
import { CameraController } from "./cameraController.js";
import { LiveController } from "@live/liveController.js";
import { authenticateToken, requireRole } from "@core/middlewares/authMiddleware.js";

const router = Router();

// All camera routes require authentication
router.use(authenticateToken);

// Camera CRUD operations (admin and operator only)
router.post("/", requireRole(["admin", "operator"]), CameraController.createCamera);
router.get("/", CameraController.getCameras); // All authenticated users can view cameras they have access to
router.get("/:camera_id", CameraController.getCameraById);
router.put("/:camera_id", requireRole(["admin", "operator"]), CameraController.updateCamera);
router.delete("/:camera_id", requireRole("admin"), CameraController.deleteCamera);
router.post("/:camera_id/start", requireRole(["admin", "operator"]), CameraController.startCamera);
router.post("/:camera_id/stop", requireRole(["admin", "operator"]), CameraController.stopCamera);

// Camera assignment operations (admin and operator only)
router.post("/:camera_id/assign", requireRole(["admin", "operator"]), CameraController.assignCamera);
router.delete("/:camera_id/assign/:user_id", requireRole(["admin", "operator"]), CameraController.removeAssignment);
router.get("/:camera_id/assignments", requireRole(["admin", "operator"]), CameraController.getCameraAssignments);

// Zones and rules: everyone who sees the camera reads them; operators of the camera change them.
const manage = requireRole(["admin", "operator"]);
router.get("/:camera_id/zones", CameraController.listZones);
router.post("/:camera_id/zones", manage, CameraController.createZone);
router.patch("/:camera_id/zones/:zone_id", manage, CameraController.updateZone);
router.delete("/:camera_id/zones/:zone_id", manage, CameraController.deleteZone);
router.get("/:camera_id/rules", CameraController.listRules);
router.post("/:camera_id/rules", manage, CameraController.createRule);
router.patch("/:camera_id/rules/:rule_id", manage, CameraController.updateRule);
router.delete("/:camera_id/rules/:rule_id", manage, CameraController.deleteRule);

// Live video: a JPEG frame, and a ticket for the MSE WebSocket that the upgrade handler relays.
router.get("/:camera_id/live/frame.jpeg", LiveController.readFrame);
router.post("/:camera_id/live/ticket", LiveController.issueTicket);

export default router;
