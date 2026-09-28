import express from "express";
import { 
  getProfile, 
  getUserByIdController, 
  getAllUsersController, 
  createUserController, 
  updateUserController, 
  deleteUserController 
} from "./userController.js";
import { authenticateToken, canAccessUser, requireRole, requireCreationRole } from "@core/middlewares/authMiddleware.js";
import { v } from "@core/middlewares/validateRequest.js";
import {
  getAllUsersSchema,
  getUserSchema,
  createUserRequestSchema,
  updateUserRequestSchema,
  deleteUserSchema,
} from "./userSchemas.js";

const router = express.Router();

// GET /users - Get all users or filter by role (admin and operator only)
router.get("/", authenticateToken, requireRole(["admin", "operator"]), v(getAllUsersSchema), getAllUsersController);

// GET /users/profile - Get current user profile (all authenticated users)
router.get("/profile", authenticateToken, getProfile);

// POST /users - Create new user (admin can create anyone, operator can create viewers only)
router.post("/", authenticateToken, requireRole(["admin", "operator"]), requireCreationRole, v(createUserRequestSchema), createUserController);

// GET /users/:id - Get user by ID (with access control)
router.get("/:id", authenticateToken, canAccessUser, v(getUserSchema), getUserByIdController);

// PUT /users/:id - Update user (admin and self only)
router.put("/:id", authenticateToken, canAccessUser, v(updateUserRequestSchema), updateUserController);

// DELETE /users/:id - Delete user (admin only)
router.delete("/:id", authenticateToken, requireRole("admin"), v(deleteUserSchema), deleteUserController);

export default router;
