/**
 * Auth middleware
 * JWT doğrulama ve yetki kontrolü
 */

import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { User, UserRole } from "@prisma/client";
import type { User as PrismaUser } from "@prisma/client";
import { AppError } from "../../shared/utils/errors";
import { HTTP_STATUS } from "@notcast/shared";

// Express Request'e user tipini ekle
declare global {
  namespace Express {
    interface User extends PrismaUser {}
  }
}

/**
 * JWT ile kimlik doğrulama gerektirir
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: unknown, user: User | false) => {
      if (err) return next(err);
      if (!user) {
        return next(AppError.unauthorized());
      }
      req.user = user;
      next();
    }
  )(req, res, next);
}

/**
 * Belirli rollere erişim kısıtlaması
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return next(AppError.forbidden());
    }
    next();
  };
}

/**
 * E-posta doğrulanmış kullanıcı gerektirir
 */
export function requireEmailVerified(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) return next(AppError.unauthorized());
  if (!req.user.emailVerified) {
    next({
      statusCode: HTTP_STATUS.FORBIDDEN,
      code: "EMAIL_NOT_VERIFIED",
      message: "Lütfen önce e-postanızı doğrulayın",
    });
    return;
  }
  next();
}

/**
 * Opsiyonel auth — kullanıcı varsa ekler, yoksa devam eder
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(
    "jwt",
    { session: false },
    (_err: unknown, user: User | false) => {
      if (user) req.user = user;
      next();
    }
  )(req, res, next);
}
