import logger from "@core/utils/logger.js";
// Dashboard routes for real-time statistics

import express from "express";
import { minioStorageService } from "./minioStorageService.js";
import { isMongoDBAvailable } from "@core/db/mongodb.js";
import { authenticateToken } from "@core/middlewares/authMiddleware.js";
import { container } from "@core/di.js";
import { UserService } from "@users/userService.js";
import { Camera } from "@cameras/cameraModel.js";

const router = express.Router();

// Get dashboard statistics based on user role and assigned cameras
router.get('/stats', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Get user details
    const user = await container.resolve(UserService).getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stats = {
      activeCameras: 0,
      todaysEvents: 0,
      highRiskAlerts: 0,
      systemStatus: 'offline',
      userCameras: [] as any[]
    };

    // Get user's assigned cameras
    if (userRole === 'admin') {
      // Admin sees all cameras
      const allCameras = await Camera.getAllCameras();
      stats.activeCameras = allCameras.length;
      stats.userCameras = allCameras;
    } else {
      // Regular users see only their assigned cameras
      const userCameras = await Camera.getCamerasByUserId(userId);
      stats.userCameras = userCameras;
      stats.activeCameras = userCameras.length;
    }

    // Check MongoDB system status
    if (isMongoDBAvailable()) {
      stats.systemStatus = 'online';
      
      try {
        const dbModule = await import("@core/db/mongodb.js");
        const collection = dbModule.getEventsCollection();
        
        // Get today's events
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysEvents = await collection.countDocuments({
            timestamp: {
              $gte: today,
              $lt: tomorrow
            }
          });

        stats.todaysEvents = todaysEvents;

        // Get high risk alerts (events with confidence > 0.8)
        const highRiskAlerts = await collection.countDocuments({
            timestamp: {
              $gte: today,
              $lt: tomorrow
            },
            'detection_metadata.confidence': { $gt: 0.8 }
          });

        stats.highRiskAlerts = highRiskAlerts;

      } catch (mongoError: any) {
        logger.warn('MongoDB query failed:', mongoError.message);
        // Keep system status as online but use fallback values
      }
    }

    res.json({
      success: true,
      stats
    });

  } catch (error: any) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get dashboard stats',
      details: error.message 
    });
  }
});

export default router;
