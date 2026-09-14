import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { ApiError } from "./errorHandler.js";
import { authConfig } from "../config/auth.js";

type UserRole = "admin" | "operator" | "viewer" | string;

interface JwtUser {
  id: string;
  username?: string;
  name?: string;
  email?: string;
  role: UserRole;
}

type AuthenticatedRequest = Request & { user?: JwtUser };

interface JwtUserPayload extends JwtPayload, JwtUser {}

/**
 * Middleware to authenticate JWT token.
 * Adds user data to req.user when the token is valid.
 */
export function authenticateToken(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) throw new ApiError(401, "Access token required");
    if (!authConfig.jwtSecret) throw new ApiError(500, "JWT secret is not configured");

    const decoded = jwt.verify(token, authConfig.jwtSecret) as JwtUserPayload;

    req.user = {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) next(new ApiError(401, "Invalid token"));
    else if (error instanceof jwt.TokenExpiredError) next(new ApiError(401, "Token expired"));
    else next(error);
  }
}

/**
 * Middleware to check whether the authenticated user has a required role.
 * Use after authenticateToken.
 */
export function requireRole(roles: UserRole | UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(req.user.role)) return next(new ApiError(403, "Insufficient permissions"));

    next();
  };
}

/**
 * Middleware to check whether a user can access a user resource by ID.
 * Users can access their own resources; admins can access any user resource.
 * Use after authenticateToken.
 */
export function canAccessUser(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  try {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const targetUserId = req.params.id;
    if (req.user.role === "admin" || req.user.id === targetUserId) return next();

    next(new ApiError(403, "Forbidden: You can only access your own profile"));
  } catch (error) {
    next(error);
  }
}