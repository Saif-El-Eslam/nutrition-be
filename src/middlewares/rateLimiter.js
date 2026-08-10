// Rate Limiting Middleware - Prevents brute force, DDoS, and API abuse
import env from "#config/env.js";

import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { getLanguage, translate, ERROR_CODES } from "#utils/localization.js";

const keyGenerator = (req, res) => {
  if (req.user && req.user.user_id) {
    return `user:${req.user.user_id}`;
  }
  return ipKeyGenerator(req.ip);
};

const emailKeyGenerator = (req) => {
  const email = req.body?.email || req.query?.email;
  if (email) {
    return `email:${email}`;
  }
  return ipKeyGenerator(req.ip);
};

const createRateLimitHandler = (time_in_mins) => {
  return (req, res) => {
    const lang = getLanguage(req);
    return res.status(429).json({
      success: false,
      code: ERROR_CODES.TOO_MANY_REQUESTS,
      message: translate(ERROR_CODES.TOO_MANY_REQUESTS, lang, {
        field: time_in_mins,
      }),
      retryAfter: req.rateLimit?.resetTime,
    });
  };
};

// TIER 1: Very Strict (3 requests per 15 mins) - Login, OTP, Password verification
export const strictLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.environment === "production" ? 5 : 30,
  keyGenerator,
  skip: (req) => env.environment === "test",
  handler: createRateLimitHandler("15"),
  standardHeaders: true,
  legacyHeaders: false,
});

// TIER 2: Moderate (5 requests per 15 mins) - OTP send, signup, password reset
export const moderateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.environment === "production" ? 10 : 50,
  keyGenerator,
  skip: (req) => env.environment === "test",
  handler: createRateLimitHandler("15"),
  standardHeaders: true,
  legacyHeaders: false,
});

// TIER 3: Standard (100 requests per 15 mins) - General authenticated endpoints
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator,
  skip: (req) => env.environment === "test",
  handler: createRateLimitHandler("15"),
  standardHeaders: true,
  legacyHeaders: false,
});

// TIER 4: Relaxed (1000 requests per hour) - Search, list, read-only operations
export const relaxedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  keyGenerator,
  skip: (req) => env.environment === "test",
  handler: createRateLimitHandler("60"),
  standardHeaders: true,
  legacyHeaders: false,
});

// Email-Based (2 requests per hour per email) - OTP sending
export const emailRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: env.environment === "production" ? 2 : 20,
  keyGenerator: emailKeyGenerator,
  skip: (req) => env.environment === "test",
  handler: createRateLimitHandler("60"),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Global (100 requests per minute) - Safety net for all routes
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator,
  skip: (req) => env.environment === "test",
  handler: createRateLimitHandler("1"),
  standardHeaders: true,
  legacyHeaders: false,
});

export const createCustomLimiter = (
  windowMs,
  maxRequests,
  keyGen = keyGenerator,
) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    keyGenerator: keyGen,
    handler: createRateLimitHandler(`${windowMs / (1000 * 60)}`),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => env.environment === "test",
  });
};

export default {
  strictLoginLimiter,
  moderateLimiter,
  standardLimiter,
  relaxedLimiter,
  emailRateLimiter,
  globalLimiter,
  createCustomLimiter,
};
