/**
 * Session repository
 * JWT refresh token oturumu yönetimi
 */

import { Session } from "@prisma/client";
import { prisma } from "../../config/database";

// ──────── Tipler ────────

export type CreateSessionData = {
  userId: string;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
};

// ──────── Sorgular ────────

/**
 * Token ile oturum bul
 */
export async function findSessionByToken(token: string): Promise<Session | null> {
  return prisma.session.findUnique({ where: { token } });
}

/**
 * Kullanıcının geçerli oturumlarını listele
 */
export async function findActiveSessionsByUserId(userId: string): Promise<Session[]> {
  return prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Oturum oluştur
 */
export async function createSession(data: CreateSessionData): Promise<Session> {
  return prisma.session.create({ data });
}

/**
 * Token ile oturumu sil (logout)
 */
export async function deleteSessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

/**
 * Kullanıcının tüm oturumlarını sil (tüm cihazlardan çıkış)
 */
export async function deleteAllSessionsByUserId(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

/**
 * Süresi geçmiş oturumları temizle (cron job için)
 */
export async function deleteExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return result.count;
}
