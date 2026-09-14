import type { Request, Response } from "express";

export function rootController(_req: Request, res: Response): void {
  res.status(200).json({
    success: true,
    message: "Welcome to FaceAlert Server!",
  });
}