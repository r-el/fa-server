/**
 * Authentication Middleware
 * JWT token verification middleware
 */
import jwt from "jsonwebtoken";
import { ApiError } from "./errorHandler.js";
import { authConfig } from "../config/auth.js";

/**
 * Middleware to authenticate JWT token
 * Adds user data to req.user if token is valid
 */
export function authenticateToken(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

    if (!token) throw new ApiError(401, "Access token required");

    const decoded = jwt.verify(token, authConfig.jwtSecret) as any;

    req.user = {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.name === "JsonWebTokenError") next(new ApiError(401, "Invalid token"));
    else if (error instanceof Error && error.name === "TokenExpiredError") next(new ApiError(401, "Token expired"));
    else next(error);
  }
}

/**
 * Middleware to check if user has required role
 * Use after authenticateToken middleware
 */
export function requireRole(roles: string | string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const userRole = req.user.role;

    // Convert single role to array
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) return next(new ApiError(403, "Insufficient permissions"));

    next();
  };
}

/**
 * Middleware to check if user can access user resource by ID
 * Users can only access their own resources unless they are admin
 * Use after authenticateToken middleware
 */
export function canAccessUser(req: any, res: any, next: any) {
  try {
    if (!req.user) return next(new ApiError(401, "Authentication required"));

    const targetUserId = req.params.id;
    const currentUser = req.user;

    // Admin can access any user resource
    if (currentUser.role === "admin") return next();

    // Regular users can only access their own resources
    if (currentUser.id !== targetUserId)
      return next(new ApiError(403, "Forbidden: You can only access your own profile"));

    next();
  } catch (error) {
    next(error);
  }
}
