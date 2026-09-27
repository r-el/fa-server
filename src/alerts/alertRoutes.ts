import { Router } from "express";
import { authenticateToken, requireRole } from "@core/middlewares/authMiddleware.js";
import { v } from "@core/middlewares/validateRequest.js";
import { AlertController } from "./alertController.js";
import {
  alertIdSchema,
  alertSummaryQuerySchema,
  listAlertsQuerySchema,
  resolveAlertSchema,
} from "./alertSchemas.js";

const router = Router();
const p = { params: alertIdSchema };

router.use(authenticateToken);

router.get("/", v({ query: listAlertsQuerySchema }), AlertController.listAlerts);
router.get("/summary", v({ query: alertSummaryQuerySchema }), AlertController.summarizeAlerts);
router.get("/:alert_id", v(p), AlertController.getAlert);
router.post("/:alert_id/acknowledge", v(p), AlertController.acknowledgeAlert);
router.post("/:alert_id/resolve", requireRole(["admin", "operator"]), v({ ...p, body: resolveAlertSchema }), AlertController.resolveAlert);
router.get("/:alert_id/snapshot", v(p), AlertController.readSnapshot);

export default router;
