import express from "express";
import { register, login, googleLogin, verifyEmailCode, resendEmailCode } from "./authController.js";
import { authLimiter } from "@core/middlewares/rateLimiter.js";
import { v } from "@core/middlewares/validateRequest.js";
import {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  verifyCodeSchema,
  resendCodeSchema,
} from "./authSchemas.js";

const router = express.Router();

// POST /auth/register
router.post("/register", authLimiter, v(registerSchema), register);

// POST /auth/login
router.post("/login", authLimiter, v(loginSchema), login);

// POST /auth/google
router.post("/google", authLimiter, v(googleLoginSchema), googleLogin);

// POST /auth/verify-code
router.post("/verify-code", v(verifyCodeSchema), verifyEmailCode);

// POST /auth/resend-code
router.post("/resend-code", authLimiter, v(resendCodeSchema), resendEmailCode);

export default router;
