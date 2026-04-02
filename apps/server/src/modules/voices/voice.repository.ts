/**
 * Voice repository
 * Ses listesi sorgulama operasyonları
 */

import { Voice } from "@prisma/client";
import { prisma } from "../../config/database";

// ──────── Tipler ────────

export type CreateVoiceData = {
  elevenLabsId: string;
  name: string;
  description?: string;
  gender: string;
  accent?: string;
  previewUrl?: string;
  category?: string;
  sortOrder?: number;
};

// ──────── Sorgular ────────

/**
 * Tüm aktif sesleri listele
 */
export async function findActiveVoices(): Promise<Voice[]> {
  return prisma.voice.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * ID ile ses bul
 */
export async function findVoiceById(id: string): Promise<Voice | null> {
  return prisma.voice.findUnique({ where: { id } });
}

/**
 * ElevenLabs ID ile ses bul
 */
export async function findVoiceByElevenLabsId(elevenLabsId: string): Promise<Voice | null> {
  return prisma.voice.findUnique({ where: { elevenLabsId } });
}

/**
 * Kategoriye göre sesleri filtrele
 */
export async function findVoicesByCategory(category: string): Promise<Voice[]> {
  return prisma.voice.findMany({
    where: { category, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Ses oluştur veya güncelle (upsert — seed için)
 */
export async function upsertVoice(data: CreateVoiceData): Promise<Voice> {
  return prisma.voice.upsert({
    where: { elevenLabsId: data.elevenLabsId },
    update: data,
    create: data,
  });
}

/**
 * Ses aktifliğini değiştir
 */
export async function toggleVoiceActive(id: string, isActive: boolean): Promise<Voice> {
  return prisma.voice.update({
    where: { id },
    data: { isActive },
  });
}

/**
 * Önizleme URL'sini güncelle
 */
export async function updateVoicePreviewUrl(id: string, previewUrl: string): Promise<Voice> {
  return prisma.voice.update({
    where: { id },
    data: { previewUrl },
  });
}
