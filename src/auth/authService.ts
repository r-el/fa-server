import { injectable, inject, delay } from "tsyringe";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authConfig } from "@core/config/auth.js";
import { ApiError } from "@core/middlewares/errorHandler.js";
import { validate } from "@core/validationService.js";
import { createUserSchema, loginUserSchema } from "@users/userSchemas.js";
import { UserService } from "@users/userService.js";
import logger from "@core/utils/logger.js";
import { EmailService } from "../services/email/emailService.js";

// Strategies
import type { IAuthStrategy, AuthResult } from "./strategies/IAuthStrategy.js";
import { LocalStrategy } from "./strategies/localStrategy.js";
import { GoogleStrategy } from "./strategies/googleStrategy.js";

const BCRYPT_SALT_ROUNDS = authConfig.bcryptSaltRounds;
const DEFAULT_TOKEN_EXPIRATION = authConfig.jwtExpiresIn;
const JWT_SECRET = authConfig.jwtSecret;

@injectable()
export class AuthService {
  private strategies: Map<string, IAuthStrategy> = new Map();

  constructor(
    @inject(delay(() => UserService)) private userService: UserService,
    private localStrategy: LocalStrategy,
    private googleStrategy: GoogleStrategy,
    private emailService: EmailService
  ) {
    // Register available strategies
    this.strategies.set(this.localStrategy.strategyName, this.localStrategy);
    this.strategies.set(this.googleStrategy.strategyName, this.googleStrategy);
  }

  /**
   * Main entry point for Strategy-based authentication
   */
  async authenticateViaStrategy(strategyName: string, credentials: unknown) {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new ApiError(400, `Authentication strategy '${strategyName}' is not supported`);
    }

    const authResult = await strategy.authenticate(credentials);

    // Send welcome email if this is a newly created user (e.g. first time Google login)
    if (authResult.isNewUser) {
      // Don't await this, let it send in the background
      this.emailService.sendWelcomeEmail(authResult.email, authResult.name).catch((err) => {
        logger.error("Failed to send welcome email in background", { error: err });
      });
    }

    const token = this.generateToken(authResult);

    return {
      user: {
        id: authResult.id,
        username: authResult.username,
        name: authResult.name,
        email: authResult.email,
        role: authResult.role,
      },
      token,
    };
  }

  /**
   * Generate JWT token for a user
   */
  generateToken(user: { id: string; username: string; name: string; email: string; role: string }): string {
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
   * Register a new user (Local Registration)
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

    // Send welcome email asynchronously
    this.emailService.sendWelcomeEmail(user.email!, user.name!).catch((err) => {
      logger.error("Failed to send welcome email in background", { error: err });
    });

    // Generate token
    const token = this.generateToken(user as any);

    return { user, token };
  }

  /**
   * Login user (Legacy Local Login, routes to LocalStrategy)
   */
  async loginUser(username: string, password: string) {
    return this.authenticateViaStrategy("local", { username, password });
  }

  /**
   * Utility for hashing passwords
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
   * Utility for verifying a password against a hash
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
}
