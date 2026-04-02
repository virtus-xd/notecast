/**
 * Rate limiting middleware'leri
 * Farklı endpoint tipleri için ayrı limitler
 */

import rateLimit from "express-rate-limit";
import { env } from "../../config/env";
import { ERROR_CODES, HTTP_STATUS } from "@notcast/shared";

const rateLimitResponse = (code: string, message: string) => ({
  success: false,
  error: {
    code,
    message,
  },
});

/** Genel API rate limit */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(ERROR_CODES.RATE_LIMIT_EXCEEDED, "Çok fazla istek. Lütfen bekleyin."),
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

/** Login endpoint için sıkı rate limit */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    "Çok fazla giriş denemesi. 15 dakika bekleyin."
  ),
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
  skipSuccessfulRequests: true,
});

/** Upload endpoint rate limit */
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 saat
  max: env.UPLOAD_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitResponse(
    ERROR_CODES.RATE_LIMIT_EXCEEDED,
    "Saatlik yükleme limitine ulaşıldı."
  ),
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});
