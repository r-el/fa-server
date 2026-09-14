import express from "express";
import { login, register } from "../controllers/authController.js";

const router = express.Router();

// POST /auth/register
router.post("/register", register);

// POST /auth/login
router.post("/login", login);

export default router;