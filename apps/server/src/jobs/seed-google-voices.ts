/**
 * Google TTS seslerini veritabanına ekleyen lightweight seed script.
 * Production'da tsx gerektirmez — derlenmiş JS olarak çalışır.
 * Dockerfile CMD'de kullanılır.
 */

import { prisma } from "../config/database";
import { logger } from "../shared/utils/logger";

const GOOGLE_VOICES = [
  {
    elevenLabsId: "tr-TR-Neural2-A",
    name: "Aylin (Google)",
    description: "Google Neural2 kadın sesi — doğal ve akıcı Türkçe.",
    gender: "female",
    accent: "turkish",
    provider: "google",
    category: "academic",
    isActive: true,
    sortOrder: 10,
  },
  {
    elevenLabsId: "tr-TR-Neural2-B",
    name: "Burak (Google)",
    description: "Google Neural2 erkek sesi — doğal ve güvenilir.",
    gender: "male",
    accent: "turkish",
    provider: "google",
    category: "academic",
    isActive: true,
    sortOrder: 11,
  },
  {
    elevenLabsId: "tr-TR-Neural2-C",
    name: "Ceren (Google)",
    description: "Google Neural2 kadın sesi — yumuşak ve sıcak ton.",
    gender: "female",
    accent: "turkish",
    provider: "google",
    category: "conversational",
    isActive: true,
    sortOrder: 12,
  },
  {
    elevenLabsId: "tr-TR-Neural2-D",
    name: "Doruk (Google)",
    description: "Google Neural2 erkek sesi — derin ve karakterli.",
    gender: "male",
    accent: "turkish",
    provider: "google",
    category: "storytelling",
    isActive: true,
    sortOrder: 13,
  },
  {
    elevenLabsId: "tr-TR-Neural2-E",
    name: "Ece (Google)",
    description: "Google Neural2 kadın sesi — genç ve enerjik.",
    gender: "female",
    accent: "turkish",
    provider: "google",
    category: "general",
    isActive: true,
    sortOrder: 14,
  },
] as const;

export async function seedGoogleVoices(): Promise<void> {
  for (const voice of GOOGLE_VOICES) {
    try {
      await prisma.voice.upsert({
        where: { elevenLabsId: voice.elevenLabsId },
        update: {
          name: voice.name,
          description: voice.description,
          provider: voice.provider,
        },
        create: voice,
      });
      logger.info(`Google ses eklendi: ${voice.name}`);
    } catch (err) {
      logger.warn({ err, voice: voice.name }, "Google ses eklenemedi (muhtemelen zaten var)");
    }
  }
}

// Mevcut ElevenLabs seslerine provider='elevenlabs' ata (boş olanlar için)
export async function ensureProviderField(): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "Voice" SET provider = 'elevenlabs' 
      WHERE provider IS NULL OR provider = ''
    `;
  } catch {
    // provider kolonu yoksa veya zaten set edilmişse yoksay
  }
}
