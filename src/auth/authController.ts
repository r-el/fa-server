import { Response, NextFunction } from "express";
import { TypedRequest } from "~types/request.js";
import { createUserSchema, loginUserSchema } from "@users/userSchemas.js";
import { container } from "@core/di.js";
import { AuthService } from "./authService.js";

/**
 * Register a new user in the system.
 * Validates the incoming body for username, password, name, email, and role.
 *
 * @route POST /auth/register
 * @param {TypedRequest<typeof createUserSchema>} req - Express TypedRequest with Zod body schema
 * @param {Response} res - Express Response object
 * @param {NextFunction} next - Express Next function for error handling
 */
export async function register(req: TypedRequest<typeof createUserSchema>, res: Response, next: NextFunction) {
  try {
    const { username, password, name, email, role } = req.body;

    const result = await container.resolve(AuthService).registerUser(username, password, name, email, role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: {
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Authenticates a user and returns a signed JWT token.
 *
 * @route POST /auth/login
 * @param {TypedRequest<typeof loginUserSchema>} req - Express TypedRequest with Zod login schema
 * @param {Response} res - Express Response object
 * @param {NextFunction} next - Express Next function for error handling
 */
export async function login(req: TypedRequest<typeof loginUserSchema>, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;

    const result = await container.resolve(AuthService).loginUser(username, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: result.user.id,
          username: result.user.username,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        token: result.token,
      },
    });
  } catch (error) {
    next(error);
  }
}
