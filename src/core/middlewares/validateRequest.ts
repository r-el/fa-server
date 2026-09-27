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
  return (req: any, res: any, next: any) => {
    if (schemas.params) req.params = validate(req.params, schemas.params);
    if (schemas.query) req.query = validate(req.query, schemas.query);
    if (schemas.body) req.body = validate(req.body, schemas.body);
    next();
  };
}
