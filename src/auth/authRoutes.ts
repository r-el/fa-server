import express from "express";
import { register, login } from "./authController.js";
import { authLimiter } from "@core/middlewares/rateLimiter.js";

const router = express.Router();

// POST /auth/register
router.post("/register", authLimiter, register);

// POST /auth/login
router.post("/login", authLimiter, login);

export default router;
