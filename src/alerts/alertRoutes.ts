import { Router } from "express";
import { authenticateToken, requireRole } from "@core/middlewares/authMiddleware.js";
import { v } from "@core/middlewares/validateRequest.js";
import { AlertController } from "./alertController.js";
import {
  listAlertsSchema,
  alertSummarySchema,
  getAlertSchema,
  resolveAlertSchema,
} from "./alertSchemas.js";

const router = Router();

router.use(authenticateToken);

router.get("/", v(listAlertsSchema), AlertController.listAlerts);
router.get("/summary", v(alertSummarySchema), AlertController.summarizeAlerts);
router.get("/:alert_id", v(getAlertSchema), AlertController.getAlert);
router.post("/:alert_id/acknowledge", v(getAlertSchema), AlertController.acknowledgeAlert);
router.post("/:alert_id/resolve", requireRole(["admin", "operator"]), v(resolveAlertSchema), AlertController.resolveAlert);
router.get("/:alert_id/snapshot", v(getAlertSchema), AlertController.readSnapshot);

export default router;
