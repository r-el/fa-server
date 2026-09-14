import express from "express";
import { login, register } from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

// POST /auth/register
router.post("/register", authLimiter, register);

// POST /auth/login
router.post("/login", authLimiter, login);

export default router;