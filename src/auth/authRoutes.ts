import express from "express";
import { register, login, googleLogin, verifyEmailCode, resendEmailCode } from "./authController.js";
import { authLimiter } from "@core/middlewares/rateLimiter.js";
import { v } from "@core/middlewares/validateRequest.js";
import { createUserSchema, loginUserSchema } from "@users/userSchemas.js";
import { verifyCodeSchema, resendCodeSchema } from "./authSchemas.js";

const router = express.Router();

// POST /auth/register
router.post("/register", authLimiter, v({ body: createUserSchema }), register);

// POST /auth/verify-code
router.post("/verify-code", v({ body: verifyCodeSchema }), verifyEmailCode);

// POST /auth/resend-code
router.post("/resend-code", authLimiter, v({ body: resendCodeSchema }), resendEmailCode);

// POST /auth/login
router.post("/login", authLimiter, v({ body: loginUserSchema }), login);

// POST /auth/google
router.post("/google", authLimiter, googleLogin);

export default router;
