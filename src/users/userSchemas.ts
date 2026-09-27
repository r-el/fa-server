// Centralized validation schemas for user data

import { z } from "zod";

const baseSchemas = {
  username: z.string().regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .min(3, "Username must be at least 3 characters long")
    .max(30, "Username cannot exceed 30 characters"),

  password: z.string().min(6, "Password must be at least 6 characters long"),

  name: z.string().trim().max(100, "Name cannot exceed 100 characters"),

  email: z.string().email("Please enter a valid email address").toLowerCase(),

  role: z.enum(["admin", "operator", "viewer"], {
    message: "Role must be admin, operator, or viewer",
  }).default("viewer"),

  userId: z.string().uuid("Invalid user ID format"),
};

const createUserSchema = z.object({
  username: baseSchemas.username,
  password: baseSchemas.password,
  name: baseSchemas.name,
  email: baseSchemas.email,
  role: baseSchemas.role.optional(),
});

const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const getUserSchema = z.object({
  params: z.object({ id: baseSchemas.userId }),
});

export const getAllUsersSchema = z.object({
  query: z.object({
    role: z.string().optional(),
  }),
});

export const createUserRequestSchema = z.object({
  body: createUserSchema,
});

export const updateUserRequestSchema = z.object({
  params: z.object({ id: baseSchemas.userId }),
  body: z.object({
    username: baseSchemas.username.optional(),
    password: baseSchemas.password.optional(),
    name: baseSchemas.name.optional(),
    email: baseSchemas.email.optional(),
    role: z.enum(["admin", "operator", "viewer"]).optional(),
  }),
});

export const deleteUserSchema = getUserSchema;

const userIdSchema = baseSchemas.userId;
const usernameSchema = baseSchemas.username;
const emailSchema = baseSchemas.email;

export {
  createUserSchema,
  loginUserSchema,
  userIdSchema,
  usernameSchema,
  emailSchema,
  baseSchemas,
};
