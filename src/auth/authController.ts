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
    const { username, password, name, email } = req.body;

    const result = await container.resolve(AuthService).registerUser(
      username,
      password,
      name,
      email,
      "viewer",
    );

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

/**
 * Authenticates a user via Google OAuth using an ID token.
 *
 * @route POST /auth/google
 * @param {Request} req - Express Request object containing { idToken: string }
 * @param {Response} res - Express Response object
 * @param {NextFunction} next - Express Next function for error handling
 */
export async function googleLogin(req: any, res: Response, next: NextFunction) {
  try {
    const { idToken } = req.body;

    const result = await container.resolve(AuthService).authenticateViaStrategy("google", { idToken });

    res.status(200).json({
      success: true,
      message: "Google login successful",
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
 * Verifies a 6-digit email code
 * @route POST /auth/verify-code
 */
export async function verifyEmailCode(req: any, res: Response, next: NextFunction) {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: "Email and 6-digit code are required" });
    }

    const result = container.resolve(AuthService).verifyCode(email, code);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
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
 * Resends a 6-digit email verification code
 * @route POST /auth/resend-code
 */
export async function resendEmailCode(req: any, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    const result = await container.resolve(AuthService).resendVerificationCode(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

