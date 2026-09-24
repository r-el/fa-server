import { injectable } from "tsyringe";



import { ApiError } from "@core/middlewares/errorHandler.js";


import User from "./userModel.js";
import { supabase } from "@core/db/supabase.js";
import { validate } from "@core/validationService.js";
import { createUserSchema, emailSchema, usernameSchema, userIdSchema } from "./userSchemas.js";
import { hashPassword } from "@core/utils/crypto.js";

@injectable()
export class UserService {
// user BLL and database operations







/**
 * Create a new user with password hashing
 * @param {Object} userData - User data
 * @returns {Object} - Created user
 */
async createUser(userData) {
  const validatedData = validate(userData, createUserSchema);
  const hashedPassword = await hashPassword(validatedData.password);

  const dbUserData = {
    ...validatedData,
    password: hashedPassword,
  };

  const { data, error } = await supabase.from("users").insert(dbUserData).select().single();

  if (error) throw new Error(`Database error: ${error.message}`);

  return new User(data);
}

/**
 * Creates a user from Google OAuth.
 * Generates a random secure password since they authenticate via Google.
 */
async createGoogleUser(userData: { username: string; name: string; email: string; role: string; google_id: string }) {
  // Generate a random 32-character password for Google users
  const randomPassword = Array(32)
    .fill(null)
    .map(() => Math.round(Math.random() * 36).toString(36))
    .join('');
    
  const hashedPassword = await hashPassword(randomPassword);

  const dbUserData = {
    username: userData.username,
    name: userData.name,
    email: userData.email,
    role: userData.role,
    password: hashedPassword,
    // Note: If you add `google_id` to Supabase `users` table, you can pass it here.
    // For now we map them by email.
  };

  const { data, error } = await supabase.from("users").insert(dbUserData).select().single();

  if (error) throw new Error(`Database error: ${error.message}`);

  return new User(data);
}

async getUserByEmail(email) {
  const validatedEmail = validate(email, emailSchema);

  const { data, error } = await supabase.from("users").select("*").eq("email", validatedEmail).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }

  return new User(data);
}

async getUserByUsername(username) {
  const validatedUsername = validate(username, usernameSchema);

  const { data, error } = await supabase.from("users").select("*").eq("username", validatedUsername).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }

  return new User(data);
}

async getUserById(id) {
  const validatedId = validate(id, userIdSchema);

  const { data, error } = await supabase.from("users").select("*").eq("id", validatedId).single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Database error: ${error.message}`);
  }

  return new User(data);
}

/**
 * Get all users or filter by role
 * @param {string} role - Optional role filter
 * @returns {Array} - Array of users
 */
async getAllUsers(role = null) {
  let query = supabase.from("users").select("*");
  
  if (role) {
    query = query.eq("role", role);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data.map(userData => new User(userData));
}

/**
 * Update user by ID
 * @param {string} id - User ID
 * @param {Object} updateData - Data to update
 * @returns {Object} - Updated user
 */
async updateUser(id, updateData) {
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
 * Delete user by ID
 * @param {string} id - User ID
 * @returns {boolean} - Success status
 */
async deleteUser(id) {
  const validatedId = validate(id, userIdSchema);

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", validatedId);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return true;
}

}