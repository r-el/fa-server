import logger from "@core/utils/logger.js";
import { serverConfig } from "@core/config/server.js";

const ENVIRONMENT = serverConfig.environment;

/**
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
class ApiError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error wrapper
 * Catches async errors and passes them to error handler
 */
const catchAsync = (fn: any) => (req: any, res: any, next: any) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Global error handling middleware
 */
const globalErrorHandler = (err: any, req: any, res: any, next: any) => {
  let error = { ...err };
  error.message = err.message || err.toString();

  // Log error
  logger.error(`${new Date().toISOString()} - ERROR:`, {
    message: error.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    error: error.message || "Internal server error",
    ...(err.errors && { errors: err.errors }),
    ...(ENVIRONMENT === "development" && { stack: err.stack }),
  });
};

export { ApiError, catchAsync, globalErrorHandler };
