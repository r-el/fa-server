import { env } from "./env.js";

export const authConfig = {
  bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
  jwtSecret: env.JWT_SECRET,
  jwtExpiresIn: env.JWT_EXPIRES_IN,
} as const;

export default authConfig;