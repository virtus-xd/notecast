/**
 * User repository
 * Kullanıcı CRUD operasyonları
 */

import { Prisma, User, UserRole } from "@prisma/client";
import { prisma } from "../../config/database";

// ──────── Tipler ────────

export type CreateUserData = {
  email: string;
  passwordHash: string;
  name: string;
  role?: UserRole;
};

export type UpdateUserData = Partial<{
  name: string;
  avatarUrl: string | null;
  passwordHash: string;
  emailVerified: boolean;
  verifyToken: string | null;
  resetToken: string | null;
  resetTokenExp: Date | null;
  preferredVoiceId: string | null;
  stripeCustomerId: string | null;
  monthlyCredits: number;
  creditsUsed: number;
  creditsResetAt: Date;
}>;

// Şifre hash'i dışarıya gösterilmez
export type SafeUser = Omit<User, "passwordHash" | "verifyToken" | "resetToken" | "resetTokenExp">;

// ──────── Yardımcı fonksiyon ────────

/**
 * User objesinden hassas alanları çıkarır
 */
export function toSafeUser(user: User): SafeUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, verifyToken, resetToken, resetTokenExp, ...safeUser } = user;
  return safeUser;
}

// ──────── Sorgular ────────

/**
 * ID ile kullanıcı bul (şifre dahil — sadece auth işlemlerinde kullan)
 */
export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

/**
 * E-posta ile kullanıcı bul (şifre dahil — sadece auth işlemlerinde kullan)
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
}

/**
 * E-posta doğrulama token'ı ile kullanıcı bul
 */
export async function findUserByVerifyToken(token: string): Promise<User | null> {
  return prisma.user.findFirst({ where: { verifyToken: token } });
}

/**
 * Şifre sıfırlama token'ı ile kullanıcı bul (süresi geçmemiş)
 */
export async function findUserByResetToken(token: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExp: { gt: new Date() },
    },
  });
}

/**
 * Yeni kullanıcı oluştur
 */
export async function createUser(data: CreateUserData): Promise<User> {
  return prisma.user.create({
    data: {
      ...data,
      email: data.email.toLowerCase().trim(),
    },
  });
}

/**
 * Kullanıcı güncelle
 */
export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  return prisma.user.update({ where: { id }, data });
}

/**
 * Kullanıcı sil
 */
export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}

/**
 * Kullanıcı kredi kullanımını artır (atomic)
 */
export async function incrementCreditsUsed(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { creditsUsed: { increment: 1 } },
  });
}

/**
 * Aylık kredi sayacını sıfırla
 */
export async function resetMonthlyCredits(userId: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: {
      creditsUsed: 0,
      creditsResetAt: new Date(),
    },
  });
}

/**
 * Kalan kredi sayısını hesaplar
 */
export function getRemainingCredits(user: User): number {
  return Math.max(0, user.monthlyCredits - user.creditsUsed);
}

/**
 * Kullanıcının podcast oluşturabilir mi kontrol et
 */
export function canCreatePodcast(user: User): boolean {
  if (user.role === UserRole.PREMIUM || user.role === UserRole.ADMIN) return true;
  return getRemainingCredits(user) > 0;
}

/**
 * Toplu kullanıcı sayısı (admin için)
 */
export async function countUsers(where?: Prisma.UserWhereInput): Promise<number> {
  return prisma.user.count({ where });
}
