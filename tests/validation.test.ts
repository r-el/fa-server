import { describe, it, expect, vi } from "vitest";
import { validate, validateAsync } from "@core/validationService.js";
import { v } from "@core/middlewares/validateRequest.js";
import { z } from "zod";
import { ApiError } from "@core/middlewares/errorHandler.js";

describe("Validation Service", () => {
  it("should pass validation when data matches schema", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const data = { name: "John", age: 30 };
    const result = validate(data, schema);

    expect(result).toEqual(data);
  });

  it("should throw ApiError with 400 status when validation fails", () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const data = { email: "invalid-email" };

    try {
      validate(data, schema);
      expect.fail("Should have thrown an error");
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e.statusCode).toBe(400);
      expect(e.errors).toBeDefined();
      expect(e.errors.length).toBeGreaterThan(0);
    }
  });

  it("should pass async validation when data matches schema", async () => {
    const schema = z.object({
      title: z.string(),
      count: z.number(),
    });

    const data = { title: "Test", count: 42 };
    const result = await validateAsync(data, schema);

    expect(result).toEqual(data);
  });

  it("should throw ApiError with 400 status when async validation fails", async () => {
    const schema = z.object({
      code: z.string().min(5),
    });

    await expect(validateAsync({ code: "123" }, schema)).rejects.toThrow(ApiError);
  });
});

describe("v (validateRequest) Middleware", () => {
  it("validates and replaces body, query, and params", async () => {
    const middleware = v(
      z.object({
        params: z.object({ id: z.string() }),
        query: z.object({ page: z.coerce.number() }),
        body: z.object({ name: z.string().trim() }),
      }),
    );

    const req: any = {
      params: { id: "cam-1" },
      query: { page: "2" },
      body: { name: "  Front Entrance  " },
    };
    const res: any = {};
    const next = vi.fn();

    await new Promise<void>((resolve) => {
      middleware(req, res, ((...args: any[]) => {
        next(...args);
        resolve();
      }) as any);
    });

    expect(next).toHaveBeenCalledWith();
    expect(req.params).toEqual({ id: "cam-1" });
    expect(req.query).toEqual({ page: 2 });
    expect(req.body).toEqual({ name: "Front Entrance" });
  });

  it("passes ApiError to next when validation fails", async () => {
    const middleware = v(
      z.object({
        body: z.object({ email: z.string().email() }),
      }),
    );

    const req: any = {
      body: { email: "not-an-email" },
    };
    const res: any = {};
    const next = vi.fn();

    await new Promise<void>((resolve) => {
      middleware(req, res, ((err?: any) => {
        next(err);
        resolve();
      }) as any);
    });

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
    expect(error.errors).toBeDefined();
  });
});
