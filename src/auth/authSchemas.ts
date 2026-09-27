import { z } from "zod";
import { createUserSchema, loginUserSchema } from "@users/userSchemas.js";

export const registerSchema = z.object({
  body: createUserSchema,
});

export const loginSchema = z.object({
  body: loginUserSchema,
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(1, "Google ID token is required"),
  }),
});

export const verifyCodeSchema = z.object({
  body: z.object({
    email: z.string().email("Please enter a valid email address").toLowerCase(),
    code: z.string().min(6, "Code must be 6 digits").max(6, "Code must be 6 digits"),
  }),
});

export const resendCodeSchema = z.object({
  body: z.object({
    email: z.string().email("Please enter a valid email address").toLowerCase(),
  }),
});
