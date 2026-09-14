// Event controller for handling HTTP requests related to events

import { Response, NextFunction } from "express";
import { TypedRequest } from "~types/request.js";
import { container } from "@core/di.js";
import { EventService } from "./eventService.js";
import { validate as ValidationService } from "@core/validationService.js";
import {
  getEventsQuerySchema,
  eventIdSchema,
  imageQuerySchema,
  eventsStatsQuerySchema
} from "./eventSchemas.js";

/**
 * Get events for the authenticated user based on their camera access
 */
export const getEvents = async (req: TypedRequest<typeof getEventsQuerySchema>, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const validatedQuery = ValidationService(
      req.query,
      getEventsQuerySchema
    );

    const userId = req.user.id;
    const userRole = req.user.role;
    const { page, limit, level, startDate, endDate, cameraId } = validatedQuery;

    // Get events for user with pagination
    const result = await container.resolve(EventService).getEventsForUser(userId, userRole, {
      page,
      limit,
      level,
      startDate,
      endDate,
      cameraId
    });

    res.status(200).json({
      success: true,
      data: result.events,
      pagination: {
        page,
        limit,
        total: (result as any).total,
        totalPages: Math.ceil((result as any).total / (limit as number)),
        hasNext: (page as number) * (limit as number) < (result as any).total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific event by ID
 */
export const getEventById = async (req: TypedRequest<typeof eventIdSchema>, res: Response, next: NextFunction) => {
  try {
    // Validate event ID
    const validatedParams = ValidationService(
      req.params,
      eventIdSchema
    );

    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = validatedParams;

    // Get event for user (includes access check)
    const event = await container.resolve(EventService).getEventById(id, userId, userRole);

    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get event image from GridFS
 */
export const getEventImage = async (req: TypedRequest<any>, res: Response, next: NextFunction) => {
  try {
    // Validate event ID
    const validatedParams = ValidationService(
      req.params,
      eventIdSchema
    );

    // Validate query parameters
    const validatedQuery = ValidationService(
      req.query,
      imageQuerySchema
    );

    const userId = req.user.id;
    const userRole = req.user.role;
    const { id } = validatedParams;
    const { download, format } = validatedQuery;

    // Get image stream
    const imageData = await container.resolve(EventService).getEventImage(id, userId, userRole);

    // Set appropriate headers

    if (!imageData) {
      return res.status(404).json({ success: false, error: "Image not found" });
    }

    res.set({
      'Content-Type': (imageData as any).contentType || `image/${format}`,
      'Content-Length': (imageData as any).contentLength,
      'Cache-Control': 'public, max-age=86400', // Cache for 1 day
      ...(download && {
        'Content-Disposition': `attachment; filename="event-${id}-image.${format}"`
      })
    });

    // Stream image data
    (imageData as any).stream.pipe(res);

  } catch (error) {
    next(error);
  }
};

/**
 * Get events statistics for the authenticated user
 */
export const getEventsStats = async (req: TypedRequest<typeof eventsStatsQuerySchema>, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters
    const validatedQuery = ValidationService(
      req.query,
      eventsStatsQuerySchema
    );

    const userId = req.user.id;
    const userRole = req.user.role;
    const { startDate, endDate, level } = validatedQuery;

    // Get events statistics for user
    const stats = await container.resolve(EventService).getEventsStatsForUser(userId, userRole);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get events count for the authenticated user
 */
export const getEventsCount = async (req: TypedRequest<typeof eventsStatsQuerySchema>, res: Response, next: NextFunction) => {
  try {
    // Validate query parameters (optional filters)
    const validatedQuery = ValidationService(
      req.query,
      eventsStatsQuerySchema
    );

    const userId = req.user.id;
    const userRole = req.user.role;
    const { startDate, endDate, level } = validatedQuery;

    // Get events statistics for user (contains count)
    const stats = await container.resolve(EventService).getEventsStatsForUser(userId, userRole);

    res.status(200).json({
      success: true,
      data: { count: stats.totalEvents }
    });
  } catch (error) {
    next(error);
  }
};
