import { Request, Response } from "express";

export const rootController = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Specter Server!",
  });
};
