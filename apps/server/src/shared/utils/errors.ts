/**
 * Özel hata sınıfları
 * Tutarlı API hata yanıtları için
 */

import { ERROR_CODES, ErrorCode, HTTP_STATUS } from "@notcast/shared";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown[];

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    details?: unknown[]
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown[]): AppError {
    return new AppError(message, HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR, details);
  }

  static unauthorized(message = "Kimlik doğrulama gerekli"): AppError {
    return new AppError(message, HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED);
  }

  static forbidden(message = "Bu işlem için yetkiniz yok"): AppError {
    return new AppError(message, HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN);
  }

  static notFound(resource = "Kaynak"): AppError {
    return new AppError(`${resource} bulunamadı`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  static alreadyExists(resource = "Kayıt"): AppError {
    return new AppError(`${resource} zaten mevcut`, HTTP_STATUS.UNPROCESSABLE_ENTITY, ERROR_CODES.ALREADY_EXISTS);
  }

  static tooManyRequests(): AppError {
    return new AppError(
      "Çok fazla istek gönderildi. Lütfen bekleyin.",
      HTTP_STATUS.TOO_MANY_REQUESTS,
      ERROR_CODES.RATE_LIMIT_EXCEEDED
    );
  }

  static insufficientCredits(): AppError {
    return new AppError(
      "Yetersiz podcast kredisi. Premium üyeliğe geçin.",
      HTTP_STATUS.FORBIDDEN,
      ERROR_CODES.INSUFFICIENT_CREDITS
    );
  }

  static internal(message = "Sunucu hatası oluştu"): AppError {
    return new AppError(message, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.INTERNAL_ERROR);
  }
}
