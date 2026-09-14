import { Request } from "express";
import { ZodTypeAny, z } from "zod";

export type AnyZodObject = ZodTypeAny;

export type TypedRequest<T extends AnyZodObject = any> = Request<
      T extends AnyZodObject ? (z.infer<T> extends { params: any } ? z.infer<T>["params"] : Record<string, any>) : Record<string, any>,
      any,
      T extends AnyZodObject ? (z.infer<T> extends { body: any } ? z.infer<T>["body"] : any) : any,
      T extends AnyZodObject ? (z.infer<T> extends { query: any } ? z.infer<T>["query"] : qs.ParsedQs) : qs.ParsedQs
> & { user?: any };
