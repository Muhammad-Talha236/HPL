import rateLimit from "express-rate-limit";

// Protect login from brute-force attacks
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Maximum login attempts per IP
  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many login attempts. Please try again later.",
  },
});

// General API protection
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  // Maximum API requests per IP
  limit: 100,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message:
      "Too many requests. Please try again later.",
  },
});