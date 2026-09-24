/**
 * Authentication Strategy Interface
 *
 * Defines the contract that every authentication method must fulfill.
 * Adding a new login method (Google, GitHub, SAML…) = implementing this interface.
 *
 * The Strategy pattern decouples "how we verify identity" from
 * "what we do after identity is verified" (token generation, user upsert).
 */

export interface AuthResult {
  /** Unique identifier — either from our DB or from the provider. */
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  /** Whether this user was just created during this authentication. */
  isNewUser: boolean;
}

export interface IAuthStrategy {
  /** Human-readable name for logging. */
  readonly strategyName: string;

  /**
   * Verifies the user's credentials and returns an `AuthResult`.
   *
   * @param credentials - The raw credentials from the request.
   *   Each strategy defines what shape it expects (password, Google token, etc.)
   * @returns The authenticated user's identity.
   * @throws {ApiError} if authentication fails.
   */
  authenticate(credentials: unknown): Promise<AuthResult>;
}
