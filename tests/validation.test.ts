import { describe, it, expect } from 'vitest';
import { validate } from '@core/validationService.js';
import { z } from 'zod';
import { ApiError } from '@core/middlewares/errorHandler.js';

describe('Validation Service', () => {
  it('should pass validation when data matches schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number()
    });

    const data = { name: "John", age: 30 };
    const result = validate(data, schema);

    expect(result).toEqual(data);
  });

  it('should throw ApiError with 400 status when validation fails', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    const data = { email: "invalid-email" };

    try {
      validate(data, schema);
      expect.fail('Should have thrown an error');
    } catch (e: any) {
      expect(e).toBeInstanceOf(ApiError);
      expect(e.statusCode).toBe(400);
      expect(e.errors).toBeDefined();
      expect(e.errors.length).toBeGreaterThan(0);
    }
  });
});
