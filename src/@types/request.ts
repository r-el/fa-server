import { Request } from "express";
import { ZodTypeAny, z } from "zod";

export type AnyZodObject = ZodTypeAny;

/** The shape decoded from the JWT token and attached by authenticateToken. */
export interface JwtUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
}

/**
 * Express Request extended with an authenticated user and relaxed body/params/query
 * so controllers can destructure freely after validation middleware has run.
 *
 * When a Zod schema generic is supplied, body/params/query are inferred from it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypedRequest<T extends AnyZodObject = any> = Request<
      Record<string, string>,
      any,   // ResBody — not relevant for typing
      T extends AnyZodObject ? z.infer<T> : any,
      Record<string, any>
> & { user: JwtUser };
