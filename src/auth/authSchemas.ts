import { z } from "zod";

export const verifyCodeSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
});

export const resendCodeSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
});
