import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@core/validationService.js', () => ({
  validate: vi.fn()
}));

const mockEventService = {
  getEventsForUser: vi.fn(),
  getEventById: vi.fn(),
  getEventImage: vi.fn(),
  getEventsStatsForUser: vi.fn()
};

vi.mock("@events/eventService.js", () => {
  return {
    EventService: vi.fn().mockImplementation(() => mockEventService)
  };
});

import { container } from 'tsyringe';
import { getEvents, getEventById } from '@events/eventController.js';
import { EventService } from '@events/eventService.js';
import * as validationService from '@core/validationService.js';

describe('Event Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should successfully fetch events with pagination', async () => {
      const req = {
        query: { page: 1, limit: 10 },
        user: { id: 'user-123', role: 'viewer' }
      } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      const next = vi.fn();

      vi.mocked(validationService.validate).mockReturnValue(req.query);
      mockEventService.getEventsForUser.mockResolvedValue({
        events: [{ _id: 'event-1', level: 'high' }],
        total: 1
      } as any);

      await getEvents(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.any(Array),
        pagination: expect.objectContaining({ total: 1 })
      }));
    });
  });

  describe('getEventById', () => {
    it('should return a specific event', async () => {
      const req = {
        params: { id: 'event-uuid' },
        user: { id: 'user-123', role: 'admin' }
      } as any;
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any;
      const next = vi.fn();

      vi.mocked(validationService.validate).mockReturnValue(req.params);
      mockEventService.getEventById.mockResolvedValue({ _id: 'event-uuid', level: 'low' } as any);

      await getEventById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ level: 'low' })
      }));
    });
  });
});
