/**
 * Express Application Setup
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsConfig } from "./core/config/cors.js";
import { globalErrorHandler } from "./core/middlewares/errorHandler.js";

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.disable("x-powered-by");

// CORS
app.use(cors(corsConfig));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

import { globalLimiter } from "./core/middlewares/rateLimiter.js";
app.use(globalLimiter);

// Routes
import rootRoutes from "./core/rootRoutes.js";
import healthRoutes from "./core/healthRoutes.js";
import authRoutes from "./auth/authRoutes.js";
import userRoutes from "./users/userRoutes.js";
import cameraRoutes from "./cameras/cameraRoutes.js";
import eventRoutes from "./events/eventRoutes.js";
import mongoRoutes from "./dashboard/mongoRoutes.js";
import dashboardRoutes from "./dashboard/dashboardRoutes.js";
import { setupSwagger } from "./core/swagger.js";

app.use("/", rootRoutes);
app.use("/", healthRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/cameras", cameraRoutes);
app.use("/events", eventRoutes);
app.use("/api/mongo", mongoRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Setup Swagger UI
setupSwagger(app);

// Global error handling middleware - must be last
app.use(globalErrorHandler);

export default app;
