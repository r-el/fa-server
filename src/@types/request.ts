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

// eslint-disable-next-line @typescript-eslint/ban-types
export type Prettify<T> = { [K in keyof T]: T[K] } & {};

type SafeExtract<T, K extends string, Fallback> = K extends keyof T
  ? [T[K]] extends [never]
    ? Fallback
    : [T[K]] extends [undefined]
    ? Fallback
    : T[K]
  : Fallback;

type InferredOrRaw<T> = T extends ZodTypeAny ? z.infer<T> : T;

export type TypedRequest<T = any> = Prettify<
  Request<
    SafeExtract<InferredOrRaw<T>, "params", Record<string, string>>,
    unknown,
    SafeExtract<InferredOrRaw<T>, "body", any>,
    SafeExtract<InferredOrRaw<T>, "query", Record<string, any>>
  >
> & { user: JwtUser };

