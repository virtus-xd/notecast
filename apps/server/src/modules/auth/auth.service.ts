/**
 * Auth Service
 * Kayıt, giriş, token yönetimi, şifre sıfırlama
 */

import bcrypt from "bcrypt";
import jwt, { type SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { User } from "@prisma/client";
import { env } from "../../config/env";
import { redis } from "../../config/redis";
import { AppError } from "../../shared/utils/errors";
import { logger } from "../../shared/utils/logger";
import {
  findUserByEmail,
  findUserById,
  findUserByVerifyToken,
  findUserByResetToken,
  createUser,
  updateUser,
  toSafeUser,
  type SafeUser,
} from "../users/user.repository";
import {
  createSession,
  findSessionByToken,
  deleteSessionByToken,
  deleteAllSessionsByUserId,
} from "./session.repository";
import type { JwtPayload } from "./strategies/jwt.strategy";

// ──────── Sabitler ────────
const BCRYPT_SALT_ROUNDS = 12;
const TOKEN_BLACKLIST_PREFIX = "blacklist:refresh:";

// ──────── Tipler ────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginResult {
  user: SafeUser;
  tokens: AuthTokens;
}

// ──────── Token üretimi ────────

/**
 * Access token üret (kısa ömürlü)
 */
function generateAccessToken(user: User): string {
  const payload: Omit<JwtPayload, "iat" | "exp"> = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions["expiresIn"],
  });
}

/**
 * Refresh token üret (uzun ömürlü, opak)
 */
function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

/**
 * Token çifti oluştur ve oturumu kaydet
 */
async function issueTokens(
  user: User,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthTokens> {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();

  // Refresh token süresini hesapla
  const expiresInMs = parseExpiry(env.JWT_REFRESH_EXPIRY);
  const expiresAt = new Date(Date.now() + expiresInMs);

  await createSession({
    userId: user.id,
    token: refreshToken,
    expiresAt,
    userAgent,
    ipAddress,
  });

  // Access token süresi (saniye)
  const expiresIn = parseExpiry(env.JWT_ACCESS_EXPIRY) / 1000;

  return { accessToken, refreshToken, expiresIn };
}

/**
 * "15m", "7d" gibi string süreleri milisaniyeye çevirir
 */
function parseExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] ?? 1000);
}

// ──────── Auth Operasyonları ────────

/**
 * Yeni kullanıcı kaydı
 */
export async function register(input: RegisterInput): Promise<SafeUser> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw AppError.alreadyExists("Bu e-posta adresi zaten kayıtlı");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
  const verifyToken = crypto.randomBytes(32).toString("hex");

  const user = await createUser({
    email: input.email,
    passwordHash,
    name: input.name,
  });

  // E-posta doğrulama token'ını kaydet
  await updateUser(user.id, { verifyToken });

  logger.info({ userId: user.id, email: user.email }, "Yeni kullanıcı kayıt oldu");

  // TODO: E-posta gönder (PART 3+ email service)

  return toSafeUser(user);
}

/**
 * E-posta + şifre ile giriş
 */
export async function login(
  user: User,
  userAgent?: string,
  ipAddress?: string
): Promise<LoginResult> {
  const tokens = await issueTokens(user, userAgent, ipAddress);

  logger.info({ userId: user.id }, "Kullanıcı giriş yaptı");

  return { user: toSafeUser(user), tokens };
}

/**
 * Refresh token ile yeni access token üret
 */
export async function refreshTokens(
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<AuthTokens> {
  // Blacklist kontrolü
  const isBlacklisted = await redis.get(`${TOKEN_BLACKLIST_PREFIX}${refreshToken}`);
  if (isBlacklisted) {
    throw AppError.unauthorized("Geçersiz token");
  }

  // DB'de oturum kontrolü
  const session = await findSessionByToken(refreshToken);
  if (!session || session.expiresAt < new Date()) {
    throw AppError.unauthorized("Oturum süresi dolmuş. Lütfen tekrar giriş yapın.");
  }

  const user = await findUserById(session.userId);
  if (!user) {
    throw AppError.unauthorized();
  }

  // Eski oturumu sil (token rotation)
  await deleteSessionByToken(refreshToken);

  // Yeni token çifti üret
  return issueTokens(user, userAgent, ipAddress);
}

/**
 * Çıkış — oturumu kapat ve refresh token'ı geçersiz kıl
 */
export async function logout(refreshToken: string): Promise<void> {
  const session = await findSessionByToken(refreshToken);

  if (session) {
    // Token'ı blacklist'e ekle (süre dolana kadar)
    const ttlMs = session.expiresAt.getTime() - Date.now();
    if (ttlMs > 0) {
      await redis.setex(
        `${TOKEN_BLACKLIST_PREFIX}${refreshToken}`,
        Math.ceil(ttlMs / 1000),
        "1"
      );
    }
    await deleteSessionByToken(refreshToken);
  }
}

/**
 * Tüm cihazlardan çıkış
 */
export async function logoutAll(userId: string): Promise<void> {
  await deleteAllSessionsByUserId(userId);
}

/**
 * E-posta doğrulama
 */
export async function verifyEmail(token: string): Promise<SafeUser> {
  const user = await findUserByVerifyToken(token);
  if (!user) {
    throw AppError.badRequest("Geçersiz veya süresi dolmuş doğrulama bağlantısı");
  }

  const updated = await updateUser(user.id, {
    emailVerified: true,
    verifyToken: null,
  });

  logger.info({ userId: user.id }, "E-posta doğrulandı");
  return toSafeUser(updated);
}

/**
 * Şifre sıfırlama e-postası gönder
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await findUserByEmail(email);

  // Güvenlik: kullanıcı bulunsun ya da bulunmasın aynı yanıt
  if (!user) {
    logger.warn({ email }, "Şifre sıfırlama: kullanıcı bulunamadı");
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 saat

  await updateUser(user.id, { resetToken, resetTokenExp });

  logger.info({ userId: user.id }, "Şifre sıfırlama token'ı oluşturuldu");

  // TODO: E-posta gönder
  // await emailService.sendPasswordReset(user.email, resetToken);
}

/**
 * Şifreyi sıfırla
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await findUserByResetToken(token);
  if (!user) {
    throw AppError.badRequest("Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı");
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  await updateUser(user.id, {
    passwordHash,
    resetToken: null,
    resetTokenExp: null,
  });

  // Tüm oturumları kapat (güvenlik)
  await deleteAllSessionsByUserId(user.id);

  logger.info({ userId: user.id }, "Şifre sıfırlandı");
}

/**
 * Şifre değiştir
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await findUserById(userId);
  if (!user) throw AppError.notFound("Kullanıcı");

  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw AppError.badRequest("Mevcut şifre hatalı");
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await updateUser(userId, { passwordHash });

  logger.info({ userId }, "Şifre değiştirildi");
}
