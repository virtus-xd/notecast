/**
 * Google TTS seslerini veritabanına ekleyen seed script.
 * WaveNet (statik) + Chirp 3 HD (API'den dinamik) seslerini ekler.
 * Server startup'ta otomatik çalışır.
 */

import { prisma } from "../config/database";
import { logger } from "../shared/utils/logger";
import { fetchAvailableVoices } from "../shared/services/google-tts.service";
import { env } from "../config/env";

// ──────── Statik WaveNet Sesleri ────────
// API key olmasa bile her zaman eklenir

const WAVENET_VOICES = [
  {
    elevenLabsId: "tr-TR-Wavenet-A",
    name: "Aylin (Google WaveNet)",
    description: "Google WaveNet kadın sesi — doğal ve akıcı Türkçe.",
    gender: "female",
    category: "academic",
    sortOrder: 1,
  },
  {
    elevenLabsId: "tr-TR-Wavenet-B",
    name: "Burak (Google WaveNet)",
    description: "Google WaveNet erkek sesi — doğal ve güvenilir.",
    gender: "male",
    category: "academic",
    sortOrder: 2,
  },
  {
    elevenLabsId: "tr-TR-Wavenet-C",
    name: "Ceren (Google WaveNet)",
    description: "Google WaveNet kadın sesi — yumuşak ve sıcak ton.",
    gender: "female",
    category: "conversational",
    sortOrder: 3,
  },
  {
    elevenLabsId: "tr-TR-Wavenet-E",
    name: "Emre (Google WaveNet)",
    description: "Google WaveNet erkek sesi — alternatif erkek tonu.",
    gender: "male",
    category: "storytelling",
    sortOrder: 4,
  },
] as const;

// ──────── Chirp 3 Ses Adı → Okunabilir İsim ────────
// API'den gelen teknik isim (tr-TR-Chirp3-HD-Xyz) → Türkçe kullanıcı adı

function chirp3DisplayName(apiName: string): { name: string; category: string } {
  // "tr-TR-Chirp3-HD-Acıbadem" → "Acıbadem"
  const persona = apiName.split("-").slice(4).join("-");
  return {
    name: `${persona} (Google Chirp 3)`,
    category: "general",
  };
}

function chirp3Gender(ssmlGender: string): string {
  if (ssmlGender === "MALE") return "male";
  if (ssmlGender === "FEMALE") return "female";
  return "neutral";
}

// ──────── Ana Seed Fonksiyonu ────────

export async function seedGoogleVoices(): Promise<void> {
  // Eski Neural2, ElevenLabs ve eski Chirp/WaveNet seslerini temizle
  try {
    await prisma.voice.deleteMany({
      where: {
        OR: [
          { elevenLabsId: { startsWith: "tr-TR-Neural2-" } },
          { provider: "elevenlabs" },
          { elevenLabsId: { startsWith: "tr-TR-Chirp3-" } },
          { elevenLabsId: "tr-TR-Wavenet-D" },
        ],
      },
    });
  } catch (err) {
    logger.warn({ err }, "Eski sesler temizlenirken hata oluştu");
  }

  // 1. WaveNet seslerini ekle (her zaman)
  for (const voice of WAVENET_VOICES) {
    try {
      await prisma.voice.upsert({
        where: { elevenLabsId: voice.elevenLabsId },
        update: {
          name: voice.name,
          description: voice.description,
          provider: "google",
        },
        create: {
          ...voice,
          accent: "turkish",
          provider: "google",
          isActive: true,
        },
      });
      logger.info(`Google WaveNet ses eklendi: ${voice.name}`);
    } catch (err) {
      logger.warn({ err, voice: voice.name }, "WaveNet ses eklenemedi");
    }
  }

  // 2. Chirp 3 seslerini API'den çek ve ekle (API key varsa)
  if (!env.GOOGLE_TTS_API_KEY) {
    logger.info("GOOGLE_TTS_API_KEY yok — Chirp 3 sesleri atlanıyor");
    return;
  }

  try {
    const allVoices = await fetchAvailableVoices();
    const chirp3Voices = allVoices.filter((v) =>
      v.name.toLowerCase().includes("chirp3")
    );

    if (chirp3Voices.length === 0) {
      logger.info("API'den Chirp 3 sesi bulunamadı (Türkçe için henüz mevcut olmayabilir)");
      return;
    }

    const maleChirp3 = chirp3Voices.filter((v) => chirp3Gender(v.ssmlGender) === "male").slice(0, 2);
    const femaleChirp3 = chirp3Voices.filter((v) => chirp3Gender(v.ssmlGender) === "female").slice(0, 2);
    const selectedChirp3 = [...maleChirp3, ...femaleChirp3];

    logger.info(`${selectedChirp3.length} adet Chirp 3 sesi eklenecek.`);

    for (let i = 0; i < selectedChirp3.length; i++) {
      const v = selectedChirp3[i]!;
      const { name, category } = chirp3DisplayName(v.name);
      const gender = chirp3Gender(v.ssmlGender);

      try {
        await prisma.voice.upsert({
          where: { elevenLabsId: v.name },
          update: { name, provider: "google" },
          create: {
            elevenLabsId: v.name,
            name,
            description: `Google Chirp 3 HD ${gender === "male" ? "erkek" : "kadın"} sesi — en yüksek kalite.`,
            gender,
            accent: "turkish",
            provider: "google",
            category,
            isActive: true,
            sortOrder: 5 + i,
          },
        });
        logger.info(`Google Chirp 3 ses eklendi: ${name}`);
      } catch (err) {
        logger.warn({ err, voice: v.name }, "Chirp 3 ses eklenemedi");
      }
    }
  } catch (err) {
    // API hatası seed'i durdurmasın
    logger.warn({ err }, "Chirp 3 sesleri çekilemedi — API hatası");
  }
}

// ──────── Provider Alanı Düzeltme ────────

export async function ensureProviderField(): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "Voice" SET provider = 'elevenlabs'
      WHERE provider IS NULL OR provider = ''
    `;
  } catch {
    // provider kolonu yoksa yoksay
  }
}
