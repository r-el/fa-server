import { container } from 'tsyringe';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CameraController } from '@cameras/cameraController.js';
import { CameraService } from '@cameras/cameraService.js';
import * as validationService from '@core/validationService.js';

vi.mock("@cameras/cameraService.js", () => ({ CameraService: class { createCamera: any = vi.fn(); listAccessibleCameras: any = vi.fn(); } }));

vi.mock('@core/validationService.js', () => ({
  validate: vi.fn()
}));

describe('Camera Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCamera', () => {
    it('should successfully create a camera', async () => {
      const req = {
        body: { name: 'Main Cam', source_url: 'rtsp://cam1' },
        user: { id: 'user-123', role: 'admin' }
      } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      const next = vi.fn();

      vi.mocked(validationService.validate).mockReturnValue(req.body);
      vi.mocked(container.resolve(CameraService).createCamera as any).mockResolvedValue({ id: 'uuid-1', ...req.body } as any);

      await CameraController.createCamera(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ name: 'Main Cam' })
      }));
    });
  });

  describe('getCameras', () => {
    it('should return cameras for the authenticated user', async () => {
      const req = {
        query: { page: 1, limit: 10 },
        user: { id: 'user-123', role: 'viewer' }
      } as any;
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() } as any;

      vi.mocked(validationService.validate).mockReturnValue(req.query);
      vi.mocked(container.resolve(CameraService).listAccessibleCameras as any).mockResolvedValue([
        { id: 'cam-1', name: 'Camera 1' }
      ] as any);

      await CameraController.getCameras(req, res, vi.fn());

      expect(container.resolve(CameraService).listAccessibleCameras as any).toHaveBeenCalledWith(req.user);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: expect.any(Array),
        total: 1
      });
    });
  });
});
