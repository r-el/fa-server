import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";
import { AnyZodObject } from "~types/request.js";
import { validate } from "@core/validationService.js";

/**
 * Express middleware that validates req.params, req.query and/or req.body
 * against the supplied Zod schemas.  Validated (and coerced) values are
 * written back onto `req` so the downstream handler receives clean data.
 *
 * Usage in routes:
 *   import { v } from "@core/middlewares/validateRequest.js";
 *   router.put("/:id", v({ params: idSchema, body: updateSchema }), controller);
 */
export function v(
  schemas:
    | {
        body?: ZodTypeAny;
        params?: ZodTypeAny;
        query?: ZodTypeAny;
      }
    | AnyZodObject
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shape = "shape" in schemas && typeof (schemas as any).shape === "object" ? (schemas as any).shape : schemas;
    if (shape.params) req.params = validate(req.params, shape.params) as typeof req.params;
    if (shape.query) req.query = validate(req.query, shape.query) as typeof req.query;
    if (shape.body) req.body = validate(req.body, shape.body);
    next();
  };
}
