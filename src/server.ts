/**
 * Express Application Setup
 *
 * Every API route lives under /api, so the web client can be served from the same origin with
 * client-side routes such as /cameras that would otherwise collide with API paths.
 */
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsConfig } from "./core/config/cors.js";
import { ApiError, globalErrorHandler } from "./core/middlewares/errorHandler.js";
import { globalLimiter } from "./core/middlewares/rateLimiter.js";
import rootRoutes from "./core/rootRoutes.js";
import healthRoutes from "./core/healthRoutes.js";
import authRoutes from "./auth/authRoutes.js";
import userRoutes from "./users/userRoutes.js";
import cameraRoutes from "./cameras/cameraRoutes.js";
import alertRoutes from "./alerts/alertRoutes.js";
import watchlistRoutes, { enrollmentBatchRoutes } from "./watchlists/watchlistRoutes.js";
import mongoRoutes from "./dashboard/mongoRoutes.js";
import dashboardRoutes from "./dashboard/dashboardRoutes.js";
import { setupSwagger } from "./core/swagger.js";

const app = express();

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      // Snapshots are shown from blob URLs, and live video plays through MediaSource blobs.
      "img-src": ["'self'", "data:", "blob:"],
      "media-src": ["'self'", "blob:"],
      "connect-src": ["'self'"],
    },
  },
}));
app.disable("x-powered-by");

// CORS
app.use(cors(corsConfig));

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const api = express.Router();
api.use(globalLimiter);
api.use("/", rootRoutes);
api.use("/", healthRoutes);
api.use("/auth", authRoutes);
api.use("/users", userRoutes);
api.use("/cameras", cameraRoutes);
api.use("/alerts", alertRoutes);
api.use("/watchlists", watchlistRoutes);
api.use("/enrollment-batches", enrollmentBatchRoutes);
api.use("/mongo", mongoRoutes);
api.use("/dashboard", dashboardRoutes);
api.use((req, res, next) => next(new ApiError(404, "Not found")));
app.use("/api", api);

// Setup Swagger UI
setupSwagger(app);

// The built web client, when this server also serves it (production image).
const clientDistDirectory = process.env.CLIENT_DIST_DIR;
if (clientDistDirectory) {
  const indexFile = path.resolve(clientDistDirectory, "index.html");
  app.use(
    express.static(clientDistDirectory, {
      index: false,
      setHeaders: (res, filePath) => {
        // Vite fingerprints everything under assets/, so those files never change.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
  app.get(/^\/(?!api(?:\/|$)|socket\.io(?:\/|$)).*/, (req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(indexFile);
  });
}

// Global error handling middleware - must be last
app.use(globalErrorHandler);

export default app;
