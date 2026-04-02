/**
 * Note Processing Job Worker
 * Bull queue worker — Not işleme pipeline'ı
 *
 * Pipeline: UPLOADED → PREPROCESSING → OCR_PROCESSING → TEXT_EXTRACTED → ANALYZING → READY
 */

import Bull from "bull";
import { noteProcessingQueue } from "./queue";
import { downloadBuffer } from "../shared/services/storage.service";
import { runOcr } from "../modules/notes/processors/ocr.processor";
import { analyzeText } from "../modules/notes/processors/text-analyzer.processor";
import {
  findNoteById,
  markNoteProcessingStarted,
  markNoteProcessingCompleted,
  markNoteProcessingFailed,
  updateNote,
} from "../modules/notes/note.repository";
import { logger } from "../shared/utils/logger";
import { emitNoteProgress, emitNoteError, emitNoteComplete } from "../shared/utils/socket-events";
import { env } from "../config/env";

// ──────── Job Verisi Tipi ────────

export interface NoteProcessingJobData {
  noteId: string;
  userId: string;
  fileKey: string;
  mimeType: string;
  rawText: string | null;   // TEXT tipi için doğrudan metin
  thumbnailKey: string | null;
}

// ──────── İlerleme Adımları ────────
// Her adıma bir yüzde eşleştir (frontend progress bar için)

const PROGRESS = {
  START: 5,
  DOWNLOAD: 15,
  OCR_START: 25,
  OCR_DONE: 60,
  ANALYZE_START: 65,
  ANALYZE_DONE: 90,
  DONE: 100,
} as const;

// ──────── Worker Başlat ────────

export function startNoteProcessingWorker(): void {
  noteProcessingQueue.process(
    "process-note",
    env.BULL_CONCURRENCY,
    async (job: Bull.Job<NoteProcessingJobData>) => {
      const { noteId, userId, fileKey, mimeType, rawText } = job.data;

      logger.info({ noteId, mimeType }, "Not işleme başladı");

      try {
        // ── 1. Not var mı? ──
        const note = await findNoteById(noteId);
        if (!note) {
          logger.warn({ noteId }, "Not bulunamadı — job atlandı");
          return;
        }

        // ── 2. PREPROCESSING ──
        await markNoteProcessingStarted(noteId, "PREPROCESSING");
        await job.progress(PROGRESS.START);
        emitNoteProgress(userId, noteId, "PREPROCESSING", PROGRESS.START, "Ön işleme başladı");

        // ── 3. Dosyayı indir (veya ham metin al) ──
        let fileBuffer: Buffer;
        if (rawText) {
          fileBuffer = Buffer.from(rawText, "utf-8");
        } else {
          fileBuffer = await downloadBuffer(fileKey);
        }

        await job.progress(PROGRESS.DOWNLOAD);
        emitNoteProgress(userId, noteId, "PREPROCESSING", PROGRESS.DOWNLOAD, "Dosya hazırlandı");

        // ── 4. OCR_PROCESSING ──
        await updateNote(noteId, { status: "OCR_PROCESSING" });
        await job.progress(PROGRESS.OCR_START);
        emitNoteProgress(userId, noteId, "OCR_PROCESSING", PROGRESS.OCR_START, "OCR işleniyor...");

        // ── 5. OCR Çalıştır ──
        const ocrResult = await runOcr(fileBuffer, mimeType);

        if (ocrResult.warnings.length > 0) {
          logger.warn({ noteId, warnings: ocrResult.warnings }, "OCR uyarıları");
        }

        // ── 6. Ham metni kaydet ──
        await updateNote(noteId, {
          status: "TEXT_EXTRACTED",
          rawExtractedText: ocrResult.text,
        });

        await job.progress(PROGRESS.OCR_DONE);
        emitNoteProgress(userId, noteId, "TEXT_EXTRACTED", PROGRESS.OCR_DONE, "Metin çıkarıldı, analiz başlıyor...");

        // ── 7. ANALYZING — Claude API ile metin analizi ──
        await updateNote(noteId, { status: "ANALYZING" });
        await job.progress(PROGRESS.ANALYZE_START);
        emitNoteProgress(userId, noteId, "ANALYZING", PROGRESS.ANALYZE_START, "Yapay zeka metni analiz ediyor...");

        const analyzed = await analyzeText(ocrResult.text, note.title);

        await job.progress(PROGRESS.ANALYZE_DONE);
        emitNoteProgress(userId, noteId, "ANALYZING", PROGRESS.ANALYZE_DONE, "Analiz tamamlandı, kaydediliyor...");

        // ── 8. READY — Tüm sonuçları kaydet ──
        await markNoteProcessingCompleted(noteId, {
          processedText: analyzed.sections.map((s) => s.content).join("\n\n"),
          sections: analyzed.sections,
          tags: analyzed.tags,
          subject: analyzed.subject,
        });

        // Başlık ve özet varsa güncelle
        const extraUpdates: Parameters<typeof updateNote>[1] = {};

        if (analyzed.title && analyzed.title !== note.title) {
          // Kullanıcı başlığı orijinal dosya adından geldiyse Claude'un daha anlamlı başlığını kullan
          extraUpdates.title = analyzed.title;
        }
        if (analyzed.subject) {
          extraUpdates.subject = analyzed.subject;
        }
        // Kullanıcı description girmemişse AI özetini kullan
        if (analyzed.summary && !note.description) {
          extraUpdates.description = analyzed.summary;
        }

        if (Object.keys(extraUpdates).length > 0) {
          await updateNote(noteId, extraUpdates);
        }

        await job.progress(PROGRESS.DONE);
        emitNoteComplete(userId, noteId, "READY");

        logger.info(
          {
            noteId,
            textLength: ocrResult.text.length,
            confidence: ocrResult.confidence.toFixed(2),
            provider: ocrResult.provider,
            sectionCount: analyzed.sections.length,
            tagCount: analyzed.tags.length,
          },
          "Not işleme tamamlandı"
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Bilinmeyen hata";

        logger.error({ err, noteId }, "Not işleme hatası");

        await markNoteProcessingFailed(noteId, errorMessage).catch(() => {});
        emitNoteError(userId, noteId, errorMessage);

        throw err; // Bull retry mekanizması için
      }
    }
  );

  // ──────── Queue Event Log'ları ────────
  noteProcessingQueue.on("stalled", (job) => {
    logger.warn({ jobId: job.id }, "Not işleme job'ı durdu (stalled)");
  });

  noteProcessingQueue.on("failed", (job, err) => {
    logger.error(
      { jobId: job.id, noteId: job.data.noteId, attempt: job.attemptsMade, err },
      "Not işleme job'ı başarısız"
    );
  });

  logger.info({ concurrency: env.BULL_CONCURRENCY }, "Note processing worker başlatıldı");
}
