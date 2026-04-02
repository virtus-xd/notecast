/**
 * ElevenLabs TTS Service
 * Türkçe ses üretimi — chunk tabanlı, MP3 birleştirme
 */

import { env } from "../../config/env";
import { logger } from "../utils/logger";

// ──────── Sabitler ────────

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";
const MAX_CHUNK_CHARS = env.ELEVENLABS_MAX_CHUNK_SIZE; // default 5000
const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;

// ──────── Tipler ────────

export interface TTSOptions {
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
  modelId?: string;
}

export interface VoiceInfo {
  voice_id: string;
  name: string;
  labels: Record<string, string>;
  preview_url: string | null;
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
    logger.warn({ attempt, delay }, "ElevenLabs isteği yeniden deneniyor");
    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, attempt + 1);
  }
}

// ──────── TTS API Çağrısı ────────

/**
 * Tek bir metin parçasını ElevenLabs ile seslendirip MP3 Buffer döner.
 */
async function generateChunk(
  text: string,
  voiceId: string,
  options: TTSOptions
): Promise<Buffer> {
  const url = `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`;

  const body = {
    text,
    model_id: options.modelId ?? env.ELEVENLABS_DEFAULT_MODEL,
    voice_settings: {
      stability: options.stability ?? 0.5,
      similarity_boost: options.similarityBoost ?? 0.8,
      style: options.style ?? 0.3,
      use_speaker_boost: options.useSpeakerBoost ?? true,
    },
    output_format: "mp3_44100_128",
  };

  const response = await withRetry(async () => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": env.ELEVENLABS_API_KEY,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`ElevenLabs API hatası ${res.status}: ${errText}`);
    }

    return res;
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ──────── Metin Bölme ────────

/**
 * Uzun metni cümle sonlarından böler.
 * Kelime ortasında veya cümle ortasında kesmez.
 */
export function splitTextIntoChunks(text: string, maxLength = MAX_CHUNK_CHARS): string[] {
  if (text.length <= maxLength) return [text];

  const chunks: string[] = [];
  // Cümle sonu karakterleri: . ! ? ve Türkçe noktalama
  const sentenceEndRe = /(?<=[.!?…])\s+/g;

  let remaining = text;

  while (remaining.length > maxLength) {
    // maxLength içindeki son cümle sonunu bul
    const slice = remaining.slice(0, maxLength);
    const matches = [...slice.matchAll(sentenceEndRe)];

    let splitAt: number;
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      splitAt = lastMatch.index! + lastMatch[0].length;
    } else {
      // Cümle sonu bulunamazsa son boşluktan böl
      const lastSpace = slice.lastIndexOf(" ");
      splitAt = lastSpace > 0 ? lastSpace + 1 : maxLength;
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
 * Metni ElevenLabs ile seslendirir.
 * Uzun metinleri chunk'lara böler, her chunk için ayrı istek yapar,
 * MP3 buffer'larını birleştirir.
 *
 * @returns MP3 formatında ses buffer'ı
 */
export async function generateSpeech(
  text: string,
  voiceId: string,
  options: TTSOptions = {},
  onProgress?: (done: number, total: number) => void
): Promise<Buffer> {
  const chunks = splitTextIntoChunks(text);

  logger.info(
    { chunkCount: chunks.length, totalChars: text.length, voiceId },
    "ElevenLabs TTS başlatıldı"
  );

  const audioBuffers: Buffer[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    logger.debug({ chunk: i + 1, total: chunks.length, chars: chunk.length }, "Chunk işleniyor");

    const audioBuffer = await generateChunk(chunk, voiceId, options);
    audioBuffers.push(audioBuffer);

    onProgress?.(i + 1, chunks.length);
  }

  // MP3 buffer'larını birleştir
  // MP3 self-synchronizing format: header-to-header birleştirme çalışır
  const merged = Buffer.concat(audioBuffers);

  logger.info(
    { chunkCount: chunks.length, totalBytes: merged.length },
    "ElevenLabs TTS tamamlandı"
  );

  return merged;
}

// ──────── Süre Tahmini ────────

/**
 * Karakter sayısından süre tahmini yapar (saniye).
 * Ortalama Türkçe konuşma hızı: ~14 karakter/saniye.
 */
export function estimateDuration(charCount: number): number {
  const CHARS_PER_SECOND = 14;
  return Math.ceil(charCount / CHARS_PER_SECOND);
}

// ──────── Ses Listesi ────────

/**
 * ElevenLabs'tan mevcut sesleri çeker.
 */
export async function fetchAvailableVoices(): Promise<VoiceInfo[]> {
  const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
    headers: { "xi-api-key": env.ELEVENLABS_API_KEY },
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs sesler alınamadı: ${response.status}`);
  }

  const data = (await response.json()) as { voices: VoiceInfo[] };
  return data.voices;
}

// ──────── Önizleme ────────

/**
 * Bir ses için kısa önizleme üretir (ilk 200 karakter).
 */
export async function generatePreview(
  voiceId: string,
  sampleText = "Merhaba! Bu sesin örnek bir kaydıdır. Notlarınızı podcast formatında dinleyebilirsiniz."
): Promise<Buffer> {
  return generateChunk(sampleText.slice(0, 200), voiceId, {
    modelId: "eleven_flash_v2_5", // Önizleme için hızlı model
  });
}
