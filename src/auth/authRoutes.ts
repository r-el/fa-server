import express from "express";
import { register, login, googleLogin, verifyEmailCode, resendEmailCode } from "./authController.js";
import { authLimiter } from "@core/middlewares/rateLimiter.js";

const router = express.Router();

// POST /auth/register
router.post("/register", authLimiter, register);

// POST /auth/verify-code
router.post("/verify-code", verifyEmailCode);

// POST /auth/resend-code
router.post("/resend-code", authLimiter, resendEmailCode);

// POST /auth/login
router.post("/login", authLimiter, login);

// POST /auth/google
router.post("/google", authLimiter, googleLogin);

export default router;
