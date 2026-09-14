import { injectable, inject } from "tsyringe";
import bcrypt from "bcrypt";
import { authConfig } from "@core/config/auth.js";
import jwt from "jsonwebtoken";
import { ApiError } from "@core/middlewares/errorHandler.js";
import { validate } from "@core/validationService.js";
import { createUserSchema, loginUserSchema } from "@users/userSchemas.js";
import { UserService } from "@users/userService.js";
import logger from "@core/utils/logger.js";

const BCRYPT_SALT_ROUNDS = authConfig.bcryptSaltRounds;
const DEFAULT_TOKEN_EXPIRATION = authConfig.jwtExpiresIn;
const JWT_SECRET = authConfig.jwtSecret;

import { delay } from "tsyringe";

@injectable()
export class AuthService {
  constructor(@inject(delay(() => UserService)) private userService: UserService) {}

  /**
   * Hash a password using bcrypt
   *
   * @param {string} password - Plain text password to hash
   * @returns {Promise<string>} - Hashed password
   * @throws {Error} - If hashing fails
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password) throw new Error("Password cannot be empty");
    if (typeof password !== "string") throw new Error("Password must be type of string");

    try {
      return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    } catch (error: any) {
      throw new Error("Failed to hash password: " + error.message);
    }
  }

  /**
   * Verify a password against a hash
   *
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password from database
   * @returns {Promise<boolean>} - True if match
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    try {
      return await bcrypt.compare(password, hash);
    } catch (error: any) {
      logger.error("Password verification error: " + error.message);
      return false;
    }
  }

  /**
   * Generate JWT token for a user
   *
   * @param {Object} user - User object
   * @returns {string} - JWT token
   */
  generateToken(user: any): string {
    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const expiresIn = DEFAULT_TOKEN_EXPIRATION;
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
  }

  /**
   * Register a new user
   */
  async registerUser(username: string, password: string, name: string, email: string, role: string = "viewer") {
    const validatedData = validate({ username, password, name, email, role }, createUserSchema);

    // Check if user exists
    const existingUser = await this.userService.getUserByUsername(validatedData.username);
    if (existingUser) {
      throw new ApiError(409, "Username already exists");
    }

    // Create user
    const user = await this.userService.createUser(validatedData);

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }

  /**
   * Login user
   */
  async loginUser(username: string, password: string) {
    const validatedData = validate({ username, password }, loginUserSchema);

    // Find user
    const user = await this.userService.getUserByUsername(validatedData.username);
    if (!user) {
      throw new ApiError(401, "Invalid username or password");
    }

    // Verify password
    const isMatch = await this.verifyPassword(validatedData.password, user.password as string);
    if (!isMatch) {
      throw new ApiError(401, "Invalid username or password");
    }

    // Generate token
    const token = this.generateToken(user);

    return { user, token };
  }
}
