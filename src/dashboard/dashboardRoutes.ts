// Dashboard statistics, computed from the user's cameras and Specter's alert summary.

import express from "express";
import { authenticateToken } from "@core/middlewares/authMiddleware.js";
import { catchAsync } from "@core/middlewares/errorHandler.js";
import { container } from "@core/di.js";
import { CameraService } from "@cameras/cameraService.js";
import { AlertService } from "@alerts/alertService.js";
import { SPECTER_EVENT_STREAM, SPECTER_HTTP_CLIENT } from "@specter/tokens.js";
import type { SpecterEventStream } from "@specter/specterEventStream.js";
import type { SpecterHttpClient } from "@specter/specterHttpClient.js";

const router = express.Router();

router.get("/stats", authenticateToken, catchAsync(async (req: any, res: any) => {
  const startOfTodayUtc = new Date();
  startOfTodayUtc.setUTCHours(0, 0, 0, 0);

  const [cameras, todaysSummary, isSpecterHealthy] = await Promise.all([
    container.resolve(CameraService).listAccessibleCameras(req.user),
    container
      .resolve(AlertService)
      .summarizeAlerts({ created_since: startOfTodayUtc.toISOString() }, req.user),
    container.resolve<SpecterHttpClient>(SPECTER_HTTP_CLIENT).isHealthy(),
  ]);
  const isNatsConnected = container.resolve<SpecterEventStream>(SPECTER_EVENT_STREAM).isConnected;

  res.json({
    success: true,
    stats: {
      activeCameras: cameras.filter((camera) => camera.live_status === "running").length,
      totalCameras: cameras.length,
      todaysEvents: todaysSummary.total_count,
      // Alerts nobody has looked at yet are the ones that need attention.
      highRiskAlerts: todaysSummary.unacknowledged_count,
      systemStatus: isSpecterHealthy && isNatsConnected ? "online" : "offline",
      todaysSummary,
    },
  });
}));

export default router;
