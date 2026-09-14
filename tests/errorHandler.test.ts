import { describe, it, expect, vi } from 'vitest';
import { ApiError, globalErrorHandler } from '@core/middlewares/errorHandler.js';

describe('Error Handler Middleware', () => {
  it('should format ApiError correctly', () => {
    const err = new ApiError(404, "Resource not found");
    const req = { originalUrl: '/api/test', method: 'GET', ip: '127.0.0.1' } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();

    // Mock console.error to avoid test output noise
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: "Resource not found"
    }));

    consoleSpy.mockRestore();
  });

  it('should fallback to 500 for standard errors', () => {
    const err = new Error("Something blew up!");
    const req = { originalUrl: '/api/test', method: 'GET', ip: '127.0.0.1' } as any;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
    const next = vi.fn();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    globalErrorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: "Something blew up!"
    }));

    consoleSpy.mockRestore();
  });
});
