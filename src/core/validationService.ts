import { ZodError, ZodTypeAny } from "zod";
import { ApiError } from "./middlewares/errorHandler.js";

function validate<T extends ZodTypeAny>(data: any, schema: T): T["_output"] {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const messages = error.issues.map((issue) => issue.message);
      const apiError = new ApiError(400, "Validation error");
      apiError.errors = messages;
      throw apiError;
    }
    throw error;
  }
}

export { validate };
