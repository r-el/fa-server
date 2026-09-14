import rateLimit from 'express-rate-limit';

/**
 * Global rate limiter to prevent abuse
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes',
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 login/register requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again after an hour',
  },
});
