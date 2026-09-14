import { describe, expect, it } from "vitest";
import { z } from "zod";
import { validate } from "../src/services/validationService.js";

describe("validation service", () => {
  it("returns parsed and transformed Zod data", () => {
    const schema = z.object({ email: z.string().email().transform((value) => value.toLowerCase()) });
    expect(validate({ email: "USER@EXAMPLE.COM" }, schema)).toEqual({ email: "user@example.com" });
  });

  it("rejects invalid data", () => {
    const schema = z.object({ age: z.number().int().positive() });
    expect(() => validate({ age: -1 }, schema)).toThrow();
  });

  it("rejects unsupported schema contracts", () => {
    expect(() => validate({}, {} as never)).toThrow("safeParse or validate");
  });
});
