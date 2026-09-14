import bcrypt from "bcrypt";
import { authConfig } from "../config/auth.js";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { ApiError } from "../middlewares/errorHandler.js";
import { validate } from "./validationService.js";
import { createUserSchema, loginUserSchema } from "../schemas/userSchemas.js";
import { errorMessage } from "../utils/errorMessage.js";

type UserRole = "admin" | "operator" | "viewer" | string;

interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

interface AuthTokenPayload extends JwtPayload {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
}

const BCRYPT_SALT_ROUNDS = authConfig.bcryptSaltRounds;
const DEFAULT_TOKEN_EXPIRATION = authConfig.jwtExpiresIn as SignOptions["expiresIn"];

/**
 * Hash a password using bcrypt.
 *
 * @param password - Plain text password to hash.
 * @returns Hashed password.
 * @throws Error if hashing fails.
 */
async function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error("Password cannot be empty");
  if (typeof password !== "string") throw new Error("Password must be type of string");

  try {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  } catch (error) {
    throw new Error("Failed to hash password: " + errorMessage(error));
  }
}

/**
 * Compare a password against a hash.
 *
 * @param password - Plain text password to check.
 * @param hash - Stored hash to compare against.
 * @returns True if password matches hash.
 * @throws Error if comparison fails.
 */
async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password) throw new Error("Password cannot be empty");
  if (typeof password !== "string") throw new Error("Password must be type of string");
  if (!hash) throw new Error("Hash cannot be empty");
  if (typeof hash !== "string") throw new Error("Hash must be type of string");
  if (hash.length !== 60) throw new Error("hash.length must be 60 characters");

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error("Failed to compare password: " + errorMessage(error));
  }
}

/**
 * Generate a JWT token for a user.
 *
 * @param user - User data included in the token.
 * @returns JWT token.
 * @throws Error if token generation fails.
 */
function generateToken(user: AuthUser): string {
  if (!authConfig.jwtSecret) throw new Error("JWT_SECRET not configured in environment variables");
  if (!user?.id || !user.username || !user.name || !user.email || !user.role) {
    throw new Error("User object must contain id, username, name, email, and role");
  }

  try {
    const payload: AuthTokenPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, authConfig.jwtSecret, { expiresIn: DEFAULT_TOKEN_EXPIRATION });
  } catch (error) {
    throw new Error("Failed to generate token: " + errorMessage(error));
  }
}

/**
 * Verify and decode a JWT token.
 *
 * @param token - JWT token to verify.
 * @returns Decoded token payload.
 * @throws ApiError if token is invalid or expired.
 */
function verifyToken(token: string): AuthTokenPayload {
  if (!authConfig.jwtSecret) throw new Error("JWT_SECRET not configured in environment variables");
  if (!token || typeof token !== "string") throw new ApiError(401, "Invalid token format");

  try {
    return jwt.verify(token, authConfig.jwtSecret) as AuthTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) throw new ApiError(401, "Token has expired");
    if (error instanceof jwt.JsonWebTokenError) throw new ApiError(401, "Invalid token");
    throw new ApiError(401, "Token verification failed");
  }
}

/**
 * Register a new user.
 *
 * @param username - Username.
 * @param password - Password.
 * @param name - Full name.
 * @param email - Email address.
 * @param role - User role, defaulting to viewer.
 * @returns User object with token.
 * @throws ApiError if registration fails.
 */
async function registerUser(username: string, password: string, name: string, email: string, role: UserRole = "viewer") {
  // Dynamic import keeps the service dependency lazy and avoids an import cycle.
  const { createUser, getUserByUsername } = await import("./userService.js");
  const validatedData = validate({ username, password, name, email, role }, createUserSchema);

  try {
    const existingUser = await getUserByUsername(validatedData.username);
    if (existingUser) throw new ApiError(409, "Username already exists");

    const newUser = await createUser(validatedData);
    const token = generateToken(newUser);

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      token,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Registration failed: " + errorMessage(error));
  }
}

/**
 * Login a user with username and password.
 *
 * @param username - Username.
 * @param password - Password.
 * @returns User object with token.
 * @throws ApiError if login fails.
 */
async function loginUser(username: string, password: string) {
  const { getUserByUsername } = await import("./userService.js");
  const validatedData = validate({ username, password }, loginUserSchema);

  try {
    const existingUser = await getUserByUsername(validatedData.username) as AuthUser | null;
    if (!existingUser) throw new ApiError(401, "Invalid username or password");
    if (!existingUser.password) throw new ApiError(401, "User exists but has no password set. Please contact administrator.");

    const isPasswordValid = await comparePassword(validatedData.password, existingUser.password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid username or password");

    return {
      user: {
        id: existingUser.id,
        username: existingUser.username,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
      },
      token: generateToken(existingUser),
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Login failed: " + errorMessage(error));
  }
}

export { hashPassword, comparePassword, generateToken, verifyToken, registerUser, loginUser };