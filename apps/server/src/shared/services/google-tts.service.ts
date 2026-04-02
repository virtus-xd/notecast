/**
 * Google Cloud TTS Service
 * Türkçe ses üretimi — WaveNet ve Chirp 3 HD desteği, chunk tabanlı
 */

import { env } from "../../config/env";
import { logger } from "../utils/logger";

// ──────── Sabitler ────────

const GOOGLE_TTS_API_BASE = "https://texttospeech.googleapis.com/v1";
const MAX_CHUNK_BYTES = 4800; // Google limit ~5000 byte, güvenli marj
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;

// ──────── Tipler ────────

export interface GoogleTTSOptions {
  speakingRate?: number;   // 0.25 - 4.0 (WaveNet) | 0.5 - 2.0 (Chirp 3)
  pitch?: number;          // -20.0 - 20.0 — Chirp 3 desteklemez, otomatik atlanır
  volumeGainDb?: number;   // -96.0 - 16.0, default 0
}

// ──────── Ses Tipi Tespiti ────────

/** Chirp 3 HD ses mi? (pitch ve bazı parametreler desteklenmez) */
export function isChirp3Voice(voiceName: string): boolean {
  return voiceName.toLowerCase().includes("chirp3");
}

/** speakingRate'i ses tipine göre güvenli aralığa sıkıştır */
function clampSpeakingRate(rate: number, voiceName: string): number {
  if (isChirp3Voice(voiceName)) {
    return Math.min(Math.max(rate, 0.5), 2.0);
  }
  return Math.min(Math.max(rate, 0.25), 4.0);
}

// ──────── Yardımcı: Retry ────────

async function withRetry<T>(fn: () => Promise<T>, attempt = 1): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const isRetryable =
      err instanceof Error &&
      (err.message.includes("429") ||
        err.message.includes("500") ||
        err.message.includes("503") ||
        err.message.includes("ECONNRESET") ||
        err.message.includes("ETIMEDOUT"));

    if (!isRetryable || attempt >= MAX_RETRY_ATTEMPTS) throw err;

    const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
    logger.warn({ attempt, delay }, "Google TTS isteği yeniden deneniyor");
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, attempt + 1);
  }
}

// ──────── TTS API Çağrısı ────────

/**
 * Tek bir metin parçasını Google Cloud TTS ile seslendirip MP3 Buffer döner.
 */
async function generateChunk(
  text: string,
  voiceName: string,
  options: GoogleTTSOptions
): Promise<Buffer> {
  const apiKey = env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_TTS_API_KEY tanımlı değil");
  }

  const url = `${GOOGLE_TTS_API_BASE}/text:synthesize?key=${apiKey}`;

  const safeRate = clampSpeakingRate(options.speakingRate ?? 1.0, voiceName);
  const chirp3 = isChirp3Voice(voiceName);

  const audioConfig: Record<string, unknown> = {
    audioEncoding: "MP3",
    sampleRateHertz: 24000,
    speakingRate: safeRate,
    volumeGainDb: options.volumeGainDb ?? 0,
  };

  // Chirp 3 pitch parametresini desteklemez — sadece WaveNet/Standard için ekle
  if (!chirp3) {
    audioConfig["pitch"] = options.pitch ?? 0;
  }

  const body = {
    input: { text },
    voice: {
      languageCode: "tr-TR",
      name: voiceName,
    },
    audioConfig,
  };

  const response = await withRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Google TTS API hatası ${res.status}: ${errText}`);
    }

    return res;
  });

  const data = (await response.json()) as { audioContent: string };
  return Buffer.from(data.audioContent, "base64");
}

// ──────── Metin Bölme ────────

/**
 * Uzun metni cümle sonlarından böler (byte bazlı).
 * Google TTS limiti ~5000 byte, UTF-8 Türkçe karakterler 2 byte olabilir.
 */
export function splitTextIntoChunks(text: string, maxBytes = MAX_CHUNK_BYTES): string[] {
  const encoder = new TextEncoder();
  if (encoder.encode(text).length <= maxBytes) return [text];

  const chunks: string[] = [];
  const sentenceEndRe = /(?<=[.!?…])\s+/g;

  let remaining = text;

  while (encoder.encode(remaining).length > maxBytes) {
    // maxBytes'a sığacak kadar karakter bul
    let safeLength = remaining.length;
    while (encoder.encode(remaining.slice(0, safeLength)).length > maxBytes) {
      safeLength = Math.floor(safeLength * 0.9);
    }

    const slice = remaining.slice(0, safeLength);
    const matches = [...slice.matchAll(sentenceEndRe)];

    let splitAt: number;
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1]!;
      splitAt = lastMatch.index! + lastMatch[0]!.length;
    } else {
      const lastSpace = slice.lastIndexOf(" ");
      splitAt = lastSpace > 0 ? lastSpace + 1 : safeLength;
    }

    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

// ──────── Ana TTS Fonksiyonu ────────

/**
 * Metni Google Cloud TTS ile seslendirir.
 * Uzun metinleri chunk'lara böler, her chunk için ayrı istek yapar,
 * MP3 buffer'larını birleştirir.
 *
 * @returns MP3 formatında ses buffer'ı
 */
export async function generateSpeech(
  text: string,
  voiceName: string,
  options: GoogleTTSOptions = {},
  onProgress?: (done: number, total: number) => void
): Promise<Buffer> {
  const chunks = splitTextIntoChunks(text);

  logger.info(
    { chunkCount: chunks.length, totalChars: text.length, voiceName },
    "Google TTS başlatıldı"
  );

  const audioBuffers: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    logger.debug({ chunk: i + 1, total: chunks.length, chars: chunk.length }, "Chunk işleniyor");

    const audioBuffer = await generateChunk(chunk, voiceName, options);
    audioBuffers.push(audioBuffer);

    onProgress?.(i + 1, chunks.length);
  }

  // MP3 buffer'larını birleştir
  const merged = Buffer.concat(audioBuffers);

  logger.info(
    { chunkCount: chunks.length, totalBytes: merged.length },
    "Google TTS tamamlandı"
  );

  return merged;
}

// ──────── Süre Tahmini ────────

/**
 * Karakter sayısından süre tahmini yapar (saniye).
 * Ortalama Türkçe konuşma hızı: ~14 karakter/saniye.
 */
export function estimateDuration(charCount: number, speakingRate = 1.0): number {
  const CHARS_PER_SECOND = 14 * speakingRate;
  return Math.ceil(charCount / CHARS_PER_SECOND);
}

// ──────── Kullanılabilir Türkçe Sesler ────────

export const GOOGLE_WAVENET_VOICES = [
  { name: "tr-TR-Wavenet-A", gender: "female", description: "WaveNet kadın sesi — doğal ve akıcı" },
  { name: "tr-TR-Wavenet-B", gender: "male",   description: "WaveNet erkek sesi — doğal ve güvenilir" },
  { name: "tr-TR-Wavenet-C", gender: "female", description: "WaveNet kadın sesi — yumuşak ton" },
  { name: "tr-TR-Wavenet-D", gender: "female", description: "WaveNet kadın sesi — farklı ton" },
  { name: "tr-TR-Wavenet-E", gender: "male",   description: "WaveNet erkek sesi — alternatif" },
] as const;

/** @deprecated Eski ad — geriye dönük uyumluluk için */
export const GOOGLE_TURKISH_VOICES = GOOGLE_WAVENET_VOICES;

// ──────── Google TTS API'den Ses Listesi Çekme ────────

interface GoogleVoiceAPIEntry {
  name: string;
  ssmlGender: "MALE" | "FEMALE" | "NEUTRAL" | "SSML_VOICE_GENDER_UNSPECIFIED";
  naturalSampleRateHertz: number;
  languageCodes: string[];
}

/**
 * Google TTS API'den mevcut Türkçe sesleri çeker.
 * WaveNet, Chirp 3 HD ve diğer tüm modelleri döner.
 */
export async function fetchAvailableVoices(): Promise<GoogleVoiceAPIEntry[]> {
  const apiKey = env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    logger.warn("GOOGLE_TTS_API_KEY tanımlı değil — ses listesi alınamıyor");
    return [];
  }

  const url = `${GOOGLE_TTS_API_BASE}/voices?languageCode=tr-TR&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Google TTS ses listesi alınamadı ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { voices: GoogleVoiceAPIEntry[] };
  return data.voices ?? [];
}
