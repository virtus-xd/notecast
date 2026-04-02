/**
 * Auth Controller
 * HTTP request/response katmanı
 */

import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { User } from "@prisma/client";
import * as authService from "./auth.service";
import { toSafeUser } from "../users/user.repository";
import { HTTP_STATUS } from "@notcast/shared";
import {
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from "@notcast/shared";

// Refresh token cookie adı
const REFRESH_TOKEN_COOKIE = "refreshToken";

// Cookie ayarları
const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
  path: "/api/auth",
};

// ──────── Controller'lar ────────

/**
 * POST /api/auth/register
 */
export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = RegisterSchema.parse(req.body);
    const user = await authService.register(input);

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        user,
        message: "Kayıt başarılı! Giriş yapabilirsiniz.",
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
export function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  passport.authenticate(
    "local",
    { session: false },
    async (err: unknown, user: User | false, info: { message?: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: info?.message ?? "E-posta veya şifre hatalı",
          },
        });
      }

      try {
        const { user: safeUser, tokens } = await authService.login(
          user,
          req.headers["user-agent"],
          req.ip
        );

        // Refresh token'ı HttpOnly cookie olarak set et
        res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshTokenCookieOptions);

        res.json({
          success: true,
          data: {
            user: safeUser,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.expiresIn,
          },
        });
      } catch (loginErr) {
        next(loginErr);
      }
    }
  )(req, res, next);
}

/**
 * POST /api/auth/refresh
 */
export async function refreshHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Cookie'den veya body'den refresh token al
    const refreshToken =
      (req.cookies as Record<string, string>)[REFRESH_TOKEN_COOKIE] ??
      (req.body as { refreshToken?: string }).refreshToken;

    if (!refreshToken) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: { code: "NO_REFRESH_TOKEN", message: "Refresh token gerekli" },
      });
      return;
    }

    const tokens = await authService.refreshTokens(
      refreshToken,
      req.headers["user-agent"],
      req.ip
    );

    res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, refreshTokenCookieOptions);

    res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken =
      (req.cookies as Record<string, string>)[REFRESH_TOKEN_COOKIE] ??
      (req.body as { refreshToken?: string }).refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/api/auth" });

    res.json({ success: true, data: { message: "Çıkış yapıldı" } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
export function meHandler(req: Request, res: Response): void {
  res.json({
    success: true,
    data: { user: toSafeUser(req.user as User) },
  });
}

/**
 * GET /api/auth/verify/:token
 */
export async function verifyEmailHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.params as { token: string };
    const user = await authService.verifyEmail(token);

    res.json({
      success: true,
      data: { user, message: "E-posta başarıyla doğrulandı" },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password
 */
export async function forgotPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(email);

    // Güvenlik: kullanıcı olsun ya da olmasın aynı yanıt
    res.json({
      success: true,
      data: {
        message: "Şifre sıfırlama bağlantısı e-postanıza gönderildi (kayıtlıysa).",
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password } = ResetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);

    res.json({
      success: true,
      data: { message: "Şifre başarıyla sıfırlandı. Giriş yapabilirsiniz." },
    });
  } catch (err) {
    next(err);
  }
}
