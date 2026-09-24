import { Router } from "express";
import { authenticateToken, requireRole } from "@core/middlewares/authMiddleware.js";
import { AlertController } from "./alertController.js";

const router = Router();

router.use(authenticateToken);

router.get("/", AlertController.listAlerts);
router.get("/summary", AlertController.summarizeAlerts);
router.get("/:alert_id", AlertController.getAlert);
router.post("/:alert_id/acknowledge", AlertController.acknowledgeAlert);
router.post("/:alert_id/resolve", requireRole(["admin", "operator"]), AlertController.resolveAlert);
router.get("/:alert_id/snapshot", AlertController.readSnapshot);

export default router;
