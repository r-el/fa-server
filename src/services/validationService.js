// Centralized validation logic supporting Joi and Zod schemas.

const validationOptions = {
  abortEarly: false, // Show all validation errors
  stripUnknown: true, // Remove unknown fields for security
  convert: true, // Convert types when possible
  allowUnknown: false, // Don't allow unknown properties
};

/**
 * Generic validation function
 *
 * @param {any} data - Data to validate
 * @param {Object} schema - Joi or Zod schema to validate against
 * @returns {any} - Validated and cleaned data
 * @throws {ValidationError} - Validation error with all issues
 */
function validate(data, schema) {
  if (typeof schema.safeParse === "function") {
    const result = schema.safeParse(data);
    if (!result.success) throw result.error;

    return result.data;
  }

  const { error, value } = schema.validate(data, validationOptions);
  if (error) throw error;

  return value;
}

export { validate };
