/**
 * Auth Route'ları
 * /api/auth prefix'i ile kullanılır
 */

import { Router } from "express";
import { loginRateLimiter } from "../../shared/middleware/rate-limiter";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
  verifyEmailHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "./auth.controller";
import { requireAuth } from "./auth.middleware";

export const authRouter = Router();

// Kayıt
authRouter.post("/register", registerHandler);

// Giriş (login rate limit: 5 deneme / 15 dakika)
authRouter.post("/login", loginRateLimiter, loginHandler);

// Token yenile
authRouter.post("/refresh", refreshHandler);

// Çıkış
authRouter.post("/logout", logoutHandler);

// Mevcut kullanıcı bilgisi (auth gerekli)
authRouter.get("/me", requireAuth, meHandler);

// E-posta doğrulama
authRouter.get("/verify/:token", verifyEmailHandler);

// Şifre sıfırlama
authRouter.post("/forgot-password", forgotPasswordHandler);
authRouter.post("/reset-password", resetPasswordHandler);
