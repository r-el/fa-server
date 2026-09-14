import express from "express";
import { rootController } from "./rootController.js";

const router = express.Router();

router.get("/", rootController);

export default router;
