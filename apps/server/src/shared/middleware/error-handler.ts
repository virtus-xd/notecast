/**
 * Global Express hata işleyici middleware
 * Tüm hataları standart API yanıt formatına dönüştürür
 */

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { ERROR_CODES, HTTP_STATUS } from "@notcast/shared";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validasyon hatası
  if (err instanceof ZodError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: "Validasyon hatası",
        details: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Uygulama hatası
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, stack: err.stack }, "AppError");
    } else {
      logger.warn({ code: err.code, message: err.message }, "AppError");
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Bilinmeyen hata
  logger.error({ err }, "Bilinmeyen hata");

  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: {
      code: ERROR_CODES.INTERNAL_ERROR,
      message: "Sunucu hatası oluştu",
    },
  });
}
