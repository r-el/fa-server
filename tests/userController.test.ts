import { container } from 'tsyringe';
import { UserService } from '@users/userService.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProfile, getUserByIdController, getAllUsersController, createUserController } from '@users/userController.js';
import * as userService from '@users/userService.js';
import { ApiError } from '@core/middlewares/errorHandler.js';

vi.mock("@users/userService.js", () => ({ UserService: class { getUserById: any = vi.fn(); getAllUsers: any = vi.fn(); createUser: any = vi.fn(); deleteUser: any = vi.fn(); updateUser: any = vi.fn(); getUserByUsername: any = vi.fn(); getUserByEmail: any = vi.fn(); } }));

describe('User Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile if found', async () => {
      const mockUser = {
        id: '123', username: 'testuser', name: 'Test User', email: 'test@example.com', role: 'viewer', created_at: '2023-01-01', updated_at: '2023-01-01'
      };

      const req = { user: { id: '123' } } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      const next = vi.fn();

      vi.mocked(container.resolve(UserService).getUserById as any).mockResolvedValue(mockUser as any);

      await getProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: { user: expect.objectContaining({ username: 'testuser' }) }
      });
    });

    it('should call next with ApiError if user not found', async () => {
      const req = { user: { id: '123' } } as any;
      const res = {} as any;
      const next = vi.fn();

      vi.mocked(container.resolve(UserService).getUserById as any).mockResolvedValue(null);

      await getProfile(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(404);
    });
  });

  describe('createUserController', () => {
    it('should allow admin to create an operator', async () => {
      const req = {
        user: { role: 'admin' },
        body: { username: 'newop', password: 'password', name: 'New Op', email: 'op@example.com', role: 'operator' }
      } as any;

      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      const next = vi.fn();

      vi.mocked(container.resolve(UserService).createUser as any).mockResolvedValue({ id: '456', ...req.body, created_at: 'now', updated_at: 'now' } as any);

      await createUserController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(container.resolve(UserService).createUser as any).toHaveBeenCalled();
    });

    it('should block operator from creating an admin', async () => {
      const req = {
        user: { role: 'operator' },
        body: { username: 'newadmin', password: 'password', name: 'New Admin', email: 'admin@example.com', role: 'admin' }
      } as any;

      const res = {} as any;
      const next = vi.fn();

      await createUserController(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(ApiError));
      expect(next.mock.calls[0][0].statusCode).toBe(403);
      expect(container.resolve(UserService).createUser as any).not.toHaveBeenCalled();
    });
  });
});
