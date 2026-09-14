import User from "../models/user.js";
import { supabase } from "../db/supabase.js";
import { validate } from "./validationService.js";
import { createUserSchema, emailSchema, usernameSchema, userIdSchema } from "../schemas/userSchemas.js";
import { hashPassword } from "./authService.js";

type UserRole = "admin" | "operator" | "viewer" | string;
type UserData = Record<string, unknown>;

/**
 * Create a new user with password hashing.
 * @param userData - User data.
 * @returns Created user.
 */
export async function createUser(userData: UserData) {
  const validatedData = validate(userData, createUserSchema);
  const hashedPassword = await hashPassword(validatedData.password);
  const dbUserData = { ...validatedData, password: hashedPassword };

  const { data, error } = await supabase.from("users").insert(dbUserData).select().single();
  if (error) throw new Error(`Database error: ${error.message}`);

  return new User(data);
}

export async function getUserByEmail(email: string) {
  const validatedEmail = validate(email, emailSchema);
  const { data, error } = await supabase.from("users").select("*").eq("email", validatedEmail).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }

  return new User(data);
}

export async function getUserByUsername(username: string) {
  const validatedUsername = validate(username, usernameSchema);
  const { data, error } = await supabase.from("users").select("*").eq("username", validatedUsername).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }

  return new User(data);
}

export async function getUserById(id: string) {
  const validatedId = validate(id, userIdSchema);
  const { data, error } = await supabase.from("users").select("*").eq("id", validatedId).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }

  return new User(data);
}

/**
 * Get all users or filter by role.
 * @param role - Optional role filter.
 * @returns Array of users.
 */
export async function getAllUsers(role: UserRole | null = null) {
  let query = supabase.from("users").select("*");
  if (role) query = query.eq("role", role);

  const { data, error } = await query;
  if (error) throw new Error(`Database error: ${error.message}`);

  return data.map((userData) => new User(userData));
}

/**
 * Update user by ID.
 * @param id - User ID.
 * @param updateData - Data to update.
 * @returns Updated user.
 */
export async function updateUser(id: string, updateData: UserData) {
  const validatedId = validate(id, userIdSchema);
  const { data, error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", validatedId)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }

  return new User(data);
}

/**
 * Delete user by ID.
 * @param id - User ID.
 * @returns Success status.
 */
export async function deleteUser(id: string): Promise<boolean> {
  const validatedId = validate(id, userIdSchema);
  const { error } = await supabase.from("users").delete().eq("id", validatedId);

  if (error) throw new Error(`Database error: ${error.message}`);
  return true;
}