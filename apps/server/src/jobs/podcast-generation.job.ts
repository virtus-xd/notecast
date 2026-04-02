/**
 * Podcast Generation Job Worker
 * Bull queue worker — Podcast oluşturma pipeline'ı
 *
 * Pipeline: PENDING → SCRIPT_WRITING → GENERATING_AUDIO → MERGING → READY
 */

import Bull from "bull";
import { podcastGenerationQueue } from "./queue";
import {
  findPodcastById,
  updatePodcast,
  updatePodcastStatus,
} from "../modules/podcasts/podcast.repository";
import { findNoteById } from "../modules/notes/note.repository";
import { generatePodcastScript } from "../shared/services/claude.service";
import type { PodcastStyle } from "../shared/services/claude.service";
import { generateSpeech, estimateDuration } from "../shared/services/elevenlabs.service";
import { uploadBuffer } from "../shared/services/storage.service";
import {
  emitPodcastProgress,
  emitPodcastComplete,
  emitPodcastError,
} from "../shared/utils/socket-events";
import { logger } from "../shared/utils/logger";
import { env } from "../config/env";

// ──────── Job Verisi Tipi ────────

export interface PodcastGenerationJobData {
  podcastId: string;
  userId: string;
  noteId: string;
  voiceId: string;   // ElevenLabs voice ID (elevenLabsId)
  style: PodcastStyle;
  speed: number;
}

// ──────── İlerleme Adımları ────────

const PROGRESS = {
  START: 5,
  SCRIPT_START: 10,
  SCRIPT_DONE: 40,
  TTS_START: 45,
  TTS_DONE: 85,
  UPLOAD: 95,
  DONE: 100,
} as const;

// ──────── Worker Başlat ────────

export function startPodcastGenerationWorker(): void {
  podcastGenerationQueue.process(
    "generate-podcast",
    env.BULL_CONCURRENCY,
    async (job: Bull.Job<PodcastGenerationJobData>) => {
      const { podcastId, userId, noteId, voiceId, style, speed } = job.data;

      logger.info({ podcastId, noteId, style }, "Podcast oluşturma başladı");

      try {
        // ── 1. Kayıtları doğrula ──
        const [podcast, note] = await Promise.all([
          findPodcastById(podcastId),
          findNoteById(noteId),
        ]);

        if (!podcast) {
          logger.warn({ podcastId }, "Podcast bulunamadı — job atlandı");
          return;
        }
        if (!note || note.status !== "READY") {
          throw new Error("Not hazır değil veya bulunamadı");
        }

        // ── 2. SCRIPT_WRITING ──
        await updatePodcastStatus(podcastId, "SCRIPT_WRITING");
        await job.progress(PROGRESS.START);
        emitPodcastProgress(userId, podcastId, "SCRIPT_WRITING", PROGRESS.START, "Script yazılıyor...");

        await job.progress(PROGRESS.SCRIPT_START);
        emitPodcastProgress(userId, podcastId, "SCRIPT_WRITING", PROGRESS.SCRIPT_START, "Claude API ile script oluşturuluyor...");

        const noteContent = buildNoteContent(note);
        const scriptText = await generatePodcastScript(noteContent, style, note.subject);

        await updatePodcast(podcastId, { scriptText });

        await job.progress(PROGRESS.SCRIPT_DONE);
        emitPodcastProgress(userId, podcastId, "SCRIPT_WRITING", PROGRESS.SCRIPT_DONE, "Script hazır, ses üretiliyor...");

        logger.info({ podcastId, scriptLength: scriptText.length }, "Script oluşturuldu");

        // ── 3. GENERATING_AUDIO — ElevenLabs TTS ──
        await updatePodcastStatus(podcastId, "GENERATING_AUDIO");
        await job.progress(PROGRESS.TTS_START);
        emitPodcastProgress(userId, podcastId, "GENERATING_AUDIO", PROGRESS.TTS_START, "Ses üretiliyor...");

        // Chunk bazlı ilerleme bildirimi
        let lastEmittedProgress: number = PROGRESS.TTS_START;

        const audioBuffer = await generateSpeech(
          scriptText,
          voiceId,
          {
            stability: 0.5,
            similarityBoost: 0.8,
            style: 0.3,
            useSpeakerBoost: true,
          },
          (done, total) => {
            // Her chunk tamamlandığında ilerleme güncelle
            const ttsRange = PROGRESS.TTS_DONE - PROGRESS.TTS_START;
            const currentProgress = Math.round(
              PROGRESS.TTS_START + (done / total) * ttsRange
            );

            if (currentProgress > lastEmittedProgress) {
              lastEmittedProgress = currentProgress;
              void job.progress(currentProgress);
              emitPodcastProgress(
                userId,
                podcastId,
                "GENERATING_AUDIO",
                currentProgress,
                `Ses üretiliyor... (${done}/${total})`
              );
            }
          }
        );

        await job.progress(PROGRESS.TTS_DONE);
        emitPodcastProgress(userId, podcastId, "MERGING", PROGRESS.TTS_DONE, "Ses kaydediliyor...");

        // ── 4. S3'e yükle ──
        const uploadResult = await uploadBuffer(audioBuffer, "audio/mpeg", {
          folder: `podcasts/${userId}`,
          fileName: `podcast-${podcastId}.mp3`,
          metadata: {
            podcastId,
            userId,
            style,
          },
        });

        await job.progress(PROGRESS.UPLOAD);

        // ── 5. READY ──
        const audioDuration = estimateDuration(scriptText.length);

        await updatePodcast(podcastId, {
          status: "READY",
          audioUrl: uploadResult.key,
          audioDuration,
          audioSizeBytes: uploadResult.sizeBytes,
          errorMessage: null,
        });

        await job.progress(PROGRESS.DONE);
        emitPodcastComplete(userId, podcastId, uploadResult.key);

        logger.info(
          {
            podcastId,
            audioBytes: uploadResult.sizeBytes,
            audioDuration,
            voiceId,
            style,
            speed,
          },
          "Podcast oluşturma tamamlandı"
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";

        logger.error({ err, podcastId }, "Podcast oluşturma hatası");

        await updatePodcastStatus(podcastId, "ERROR", errorMessage).catch(() => {});
        emitPodcastError(userId, podcastId, errorMessage);

        throw err;
      }
    }
  );

  podcastGenerationQueue.on("stalled", (job) => {
    logger.warn({ jobId: job.id }, "Podcast generation job'ı durdu (stalled)");
  });

  podcastGenerationQueue.on("failed", (job, err) => {
    logger.error(
      { jobId: job.id, podcastId: job.data.podcastId, attempt: job.attemptsMade, err },
      "Podcast generation job'ı başarısız"
    );
  });

  logger.info({ concurrency: env.BULL_CONCURRENCY }, "Podcast generation worker başlatıldı");
}

// ──────── Yardımcı ────────

type NoteForContent = {
  title: string;
  subject: string | null;
  sections: unknown;
  processedText: string | null;
  rawExtractedText: string | null;
};

/**
 * Not modelinden script için içerik metni üretir.
 */
function buildNoteContent(note: NoteForContent): string {
  type Section = { title?: string; content: string; order: number };

  const sections = Array.isArray(note.sections)
    ? (note.sections as Section[]).sort((a, b) => a.order - b.order)
    : null;

  if (sections && sections.length > 0) {
    return sections
      .map((s) => (s.title ? `## ${s.title}\n\n${s.content}` : s.content))
      .join("\n\n");
  }

  return note.processedText ?? note.rawExtractedText ?? note.title;
}
