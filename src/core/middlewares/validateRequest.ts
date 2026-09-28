import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";
import { AnyZodObject } from "~types/request.js";
import { validateAsync } from "@core/validationService.js";

/**
 * Express middleware that validates req.params, req.query and/or req.body
 * against the supplied Zod schemas. Validated (and coerced) values are
 * written back onto `req` so the downstream handler receives clean data.
 *
 * Usage in routes:
 *   import { v } from "@core/middlewares/validateRequest.js";
 *   router.put("/:id", v({ params: idSchema, body: updateSchema }), controller);
 */
function safeAssign<K extends keyof Request>(req: Request, key: K, value: Request[K]): void {
  try {
    req[key] = value;
  } catch (error) {
    if (error instanceof TypeError) {
      Object.defineProperty(req, key, {
        value,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      return;
    }
    throw error;
  }
}

export function v(
  schemas:
    | {
        body?: ZodTypeAny;
        params?: ZodTypeAny;
        query?: ZodTypeAny;
      }
    | AnyZodObject,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shape = "shape" in schemas && typeof (schemas as any).shape === "object" ? (schemas as any).shape : schemas;

    Promise.resolve()
      .then(async () => {
        if (shape.params) {
          const validatedParams = (await validateAsync(req.params, shape.params)) as typeof req.params;
          safeAssign(req, "params", validatedParams);
        }
        if (shape.query) {
          const validatedQuery = (await validateAsync(req.query, shape.query)) as typeof req.query;
          safeAssign(req, "query", validatedQuery);
        }
        if (shape.body) {
          const validatedBody = await validateAsync(req.body, shape.body);
          safeAssign(req, "body", validatedBody);
        }
        next();
      })
      .catch(next);
  };
}
