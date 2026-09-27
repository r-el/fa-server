import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";
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
export function v(schemas: {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Zod returns typed objects; we write them back so downstream handlers get clean data.
    // The `as` casts are safe because the middleware sits between Express parsing and handlers.
    if (schemas.params) req.params = validate(req.params, schemas.params) as typeof req.params;
    if (schemas.query) req.query = validate(req.query, schemas.query) as typeof req.query;
    if (schemas.body) req.body = validate(req.body, schemas.body);
    next();
  };
}
