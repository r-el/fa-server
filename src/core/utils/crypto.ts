import bcrypt from "bcrypt";
import { authConfig } from "@core/config/auth.js";

const BCRYPT_SALT_ROUNDS = authConfig.bcryptSaltRounds;

export async function hashPassword(password: string): Promise<string> {
  if (!password) throw new Error("Password cannot be empty");
  if (typeof password !== "string") throw new Error("Password must be type of string");

  try {
    return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  } catch (error: any) {
    throw new Error("Failed to hash password: " + error.message);
  }
}
