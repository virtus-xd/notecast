/**
 * TTS Provider Router
 * Provider'a göre doğru TTS servisini çağırır (ElevenLabs veya Google)
 */

import {
  generateSpeech as elevenLabsGenerate,
  estimateDuration as elevenLabsEstimate,
} from "./elevenlabs.service";
import {
  generateSpeech as googleGenerate,
  estimateDuration as googleEstimate,
} from "./google-tts.service";
import { logger } from "../utils/logger";

export type TTSProvider = "elevenlabs" | "google";

export interface TTSRequest {
  text: string;
  voiceId: string;       // Provider-specific voice ID
  provider: TTSProvider;
  speed?: number;
  onProgress?: (done: number, total: number) => void;
}

/**
 * Provider'a göre TTS üretimi yapar.
 * @returns MP3 Buffer
 */
export async function generateTTS(request: TTSRequest): Promise<Buffer> {
  const { text, voiceId, provider, speed = 1.0, onProgress } = request;

  logger.info({ provider, voiceId, textLength: text.length }, "TTS üretimi başlatılıyor");

  switch (provider) {
    case "google":
      return googleGenerate(text, voiceId, { speakingRate: speed }, onProgress);

    case "elevenlabs":
    default:
      return elevenLabsGenerate(
        text,
        voiceId,
        {
          stability: 0.5,
          similarityBoost: 0.8,
          style: 0.3,
          useSpeakerBoost: true,
        },
        onProgress
      );
  }
}

/**
 * Provider'a göre süre tahmini yapar.
 */
export function estimateTTSDuration(
  charCount: number,
  provider: TTSProvider,
  speed = 1.0
): number {
  switch (provider) {
    case "google":
      return googleEstimate(charCount, speed);
    case "elevenlabs":
    default:
      return elevenLabsEstimate(charCount);
  }
}
