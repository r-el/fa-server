// Centralized validation logic supporting Joi and Zod schemas.

const validationOptions = {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
  allowUnknown: false,
} as const;

interface ZodValidationResult<T> {
  success: true;
  data: T;
}

interface ZodValidationFailure {
  success: false;
  error: Error;
}

interface ZodSchema<T> {
  safeParse: (data: unknown) => ZodValidationResult<T> | ZodValidationFailure;
}

interface JoiSchema<T> {
  validate: (data: unknown, options: typeof validationOptions) => { error?: Error; value: T };
}

type ValidationSchema<T> = ZodSchema<T> | JoiSchema<T>;

/**
 * Generic validation function for Joi and Zod schemas.
 *
 * @param data - Data to validate.
 * @param schema - Joi or Zod schema to validate against.
 * @returns Validated and cleaned data.
 * @throws Validation error with all issues.
 */
function validate<T>(data: unknown, schema: ValidationSchema<T>): T {
  if ("safeParse" in schema) {
    const result = schema.safeParse(data);
    if (result.success === false) throw result.error;

    return result.data;
  }

  if (typeof schema.validate !== "function") {
    throw new TypeError("Schema must provide either safeParse or validate");
  }

  const { error, value } = schema.validate(data, validationOptions);
  if (error) throw error;

  return value;
}

export { validate };