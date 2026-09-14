import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { serverConfig } from "../config/server.js";

const ENVIRONMENT = serverConfig.environment;

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const catchAsync = (
  handler: (req: Request, res: Response, next: NextFunction) => unknown,
) => (req: Request, res: Response, next: NextFunction): void => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`${new Date().toISOString()} - ERROR:`, {
    message: error.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  if (err.isJoi) {
    const message = err.details.map((detail: { message: string }) => detail.message).join(", ");
    error = new ApiError(400, message);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Internal server error",
    ...(ENVIRONMENT === "development" && { stack: err.stack }),
  });
};