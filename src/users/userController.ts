import { Response } from "express";
import { TypedRequest } from "~types/request.js";
import { container } from "@core/di.js";
import { UserService } from "./userService.js";
import { ApiError, catchAsync } from "@core/middlewares/errorHandler.js";
import User from "./userModel.js";

import {
  getAllUsersSchema,
  getUserSchema,
  createUserRequestSchema,
  updateUserRequestSchema,
  deleteUserSchema,
} from "./userSchemas.js";

const userService = () => container.resolve(UserService);

function formatUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

/**
 * Get user profile (current authenticated user)
 * GET /users/profile
 */
export const getProfile = catchAsync(async (req: TypedRequest, res: Response) => {
  const user = await userService().getUserById(req.user.id);
  if (!user) throw new ApiError(404, "User not found");
  res.json({ success: true, data: { user: formatUser(user) } });
});

/**
 * Get user by ID
 * GET /users/:id
 * Access control handled by canAccessUser middleware
 */
export const getUserByIdController = catchAsync(async (req: TypedRequest<typeof getUserSchema>, res: Response) => {
  const user = await userService().getUserById(req.params.id);
  if (!user) throw new ApiError(404, "User not found");
  res.json({ success: true, data: { user: formatUser(user) } });
});

/**
 * Get all users or filter by role
 * GET /users or GET /users?role=viewer
 */
export const getAllUsersController = catchAsync(async (req: TypedRequest<typeof getAllUsersSchema>, res: Response) => {
  const { role } = req.query;
  const users = await userService().getAllUsers(role);
  res.json({ success: true, data: users.map(formatUser) });
});

/**
 * Create new user
 * POST /users
 * Role-hierarchy enforcement handled by requireCreationRole middleware
 */
export const createUserController = catchAsync(async (req: TypedRequest<typeof createUserRequestSchema>, res: Response) => {
  const newUser = await userService().createUser(req.body);
  res.status(201).json({ success: true, data: formatUser(newUser) });
});

/**
 * Update user
 * PUT /users/:id
 */
export const updateUserController = catchAsync(async (req: TypedRequest<typeof updateUserRequestSchema>, res: Response) => {
  const updatedUser = await userService().updateUser(req.params.id, req.body);
  if (!updatedUser) throw new ApiError(404, "User not found");
  res.json({ success: true, data: formatUser(updatedUser) });
});

/**
 * Delete user
 * DELETE /users/:id
 */
export const deleteUserController = catchAsync(async (req: TypedRequest<typeof deleteUserSchema>, res: Response) => {
  await userService().deleteUser(req.params.id);
  res.json({ success: true, message: "User deleted successfully" });
});
