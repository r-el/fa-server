import { Response } from "express";
import { TypedRequest } from "~types/request.js";
import { container } from "@core/di.js";
import { catchAsync } from "@core/middlewares/errorHandler.js";
import { validate } from "@core/validationService.js";
import { createUserSchema, loginUserSchema } from "@users/userSchemas.js";
import { AuthService } from "./authService.js";
import { verifyCodeSchema, resendCodeSchema } from "./authSchemas.js";

const authService = () => container.resolve(AuthService);

function formatAuthUser(user: any) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * Register a new user in the system.
 * @route POST /auth/register
 */
export const register = catchAsync(async (req: TypedRequest, res: Response) => {
  const { username, password, name, email } = validate(req.body, createUserSchema);

  const result = await authService().registerUser(username, password, name, email, "viewer");

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: { user: formatAuthUser(result.user), token: result.token },
  });
});

/**
 * Authenticates a user and returns a signed JWT token.
 * @route POST /auth/login
 */
export const login = catchAsync(async (req: TypedRequest, res: Response) => {
  const { username, password } = validate(req.body, loginUserSchema);

  const result = await authService().loginUser(username, password);

  res.json({
    success: true,
    message: "Login successful",
    data: { user: formatAuthUser(result.user), token: result.token },
  });
});

/**
 * Authenticates a user via Google OAuth using an ID token.
 * @route POST /auth/google
 */
export const googleLogin = catchAsync(async (req: TypedRequest, res: Response) => {
  const { idToken } = req.body;

  const result = await authService().authenticateViaStrategy("google", { idToken });

  res.json({
    success: true,
    message: "Google login successful",
    data: { user: formatAuthUser(result.user), token: result.token },
  });
});

/**
 * Verifies a 6-digit email code.
 * @route POST /auth/verify-code
 */
export const verifyEmailCode = catchAsync(async (req: TypedRequest, res: Response) => {
  const { email, code } = validate(req.body, verifyCodeSchema);

  const result = authService().verifyCode(email, code);

  res.json({
    success: true,
    message: "Email verified successfully",
    data: { user: formatAuthUser(result.user), token: result.token },
  });
});

/**
 * Resends a 6-digit email verification code.
 * @route POST /auth/resend-code
 */
export const resendEmailCode = catchAsync(async (req: TypedRequest, res: Response) => {
  const { email } = validate(req.body, resendCodeSchema);

  const result = await authService().resendVerificationCode(email);

  res.json(result);
});
