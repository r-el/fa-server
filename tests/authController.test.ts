import { container } from 'tsyringe';
import { AuthService } from '@auth/authService.js';
import { describe, it, expect, vi } from 'vitest';
import { register, login } from '@auth/authController.js';
import * as authService from '@auth/authService.js';

vi.mock("@auth/authService.js", () => ({ AuthService: class { registerUser: any = vi.fn(); loginUser: any = vi.fn(); } }));

describe('Auth Controller', () => {
  it('should successfully register a user and return a token', async () => {
    const req = {
      body: {
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'viewer'
      }
    } as any;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as any;

    const next = vi.fn();

    vi.mocked(container.resolve(AuthService).registerUser as any).mockResolvedValue({
      user: { id: 'uuid-123', ...req.body },
      token: 'jwt-token-123'
    });

    await register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "User registered successfully",
      data: {
        user: expect.objectContaining({
          username: 'testuser'
        }),
        token: 'jwt-token-123'
      }
    });
  });

  it('should call next with error if registration fails', async () => {
    const req = { body: {} } as any;
    const res = {} as any;
    const next = vi.fn();

    const error = new Error('Registration failed');
    vi.mocked(container.resolve(AuthService).registerUser as any).mockRejectedValue(error);

    await register(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});
