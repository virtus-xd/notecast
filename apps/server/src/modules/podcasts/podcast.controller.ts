/**
 * Podcast Controller
 * Podcast oluşturma ve yönetimi
 */

import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import {
  findPodcastById,
  findPodcastWithNoteById,
  findPodcastsByUserId,
  findPodcastsByNoteId,
  createPodcast,
  updatePodcast,
  updatePodcastStatus,
  deletePodcast,
  countPodcastsThisMonth,
} from "./podcast.repository";
import { findNoteById } from "../notes/note.repository";
import { findVoiceById } from "../voices/voice.repository";
import { podcastGenerationQueue } from "../../jobs/queue";
import { AppError } from "../../shared/utils/errors";
import {
  GeneratePodcastSchema,
  PaginationSchema,
  HTTP_STATUS,
} from "@notcast/shared";
import { canCreatePodcast } from "../users/user.repository";
import { logger } from "../../shared/utils/logger";
import { deleteObject, getPresignedDownloadUrl, downloadBuffer } from "../../shared/services/storage.service";

// ──────── List Handler ────────

/**
 * GET /api/podcasts
 */
export async function listPodcastsHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { page, limit } = PaginationSchema.parse(req.query);
    const noteId = (req.query as Record<string, string>)["noteId"];

    if (noteId) {
      // Belirli bir nota ait podcast'leri listele
      const podcasts = await findPodcastsByNoteId(noteId);
      res.json({ success: true, data: podcasts });
      return;
    }

    const result = await findPodcastsByUserId({
      userId: user.id,
      page,
      limit,
    });

    res.json({
      success: true,
      data: result.podcasts,
      meta: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPrevPage: result.page > 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ──────── Detail Handler ────────

/**
 * GET /api/podcasts/:id
 */
export async function getPodcastHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const podcast = await findPodcastWithNoteById(id, user.id);
    if (!podcast) return next(AppError.notFound("Podcast"));

    // Audio URL'si varsa presigned URL'e çevir
    let audioUrl: string | null = null;
    if (podcast.audioUrl) {
      audioUrl = await getPresignedDownloadUrl(podcast.audioUrl).catch(() => null);
    }

    res.json({ success: true, data: { ...podcast, audioUrl } });
  } catch (err) {
    next(err);
  }
}

// ──────── Generate Handler ────────

/**
 * POST /api/podcasts/generate
 */
export async function generatePodcastHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const input = GeneratePodcastSchema.parse(req.body);

    // Not var mı ve kullanıcıya ait mi?
    const note = await findNoteById(input.noteId, user.id);
    if (!note) return next(AppError.notFound("Not"));
    if (note.status !== "READY") {
      return next(AppError.badRequest("Not henüz işlenmemiş"));
    }

    // Ses var mı?
    const voice = await findVoiceById(input.voiceId);
    if (!voice || !voice.isActive) {
      return next(AppError.badRequest("Geçersiz ses seçimi"));
    }

    // Kredi kontrolü
    if (!canCreatePodcast(user)) {
      const usedThisMonth = await countPodcastsThisMonth(user.id);
      return next(
        AppError.forbidden(
          `Aylık ücretsiz podcast limitine ulaştınız (${usedThisMonth}/${user.monthlyCredits}). Premium'a geçin.`
        )
      );
    }

    // Podcast kaydı oluştur
    const podcast = await createPodcast({
      userId: user.id,
      noteId: note.id,
      title: note.title,
      description: note.description ?? undefined,
      voiceId: voice.id,
      voiceName: voice.name,
      style: input.style,
      speed: input.speed,
    });

    // Kuyruğa ekle
    await podcastGenerationQueue.add(
      "generate-podcast",
      {
        podcastId: podcast.id,
        userId: user.id,
        noteId: note.id,
        voiceId: voice.elevenLabsId,
        style: input.style,
        speed: input.speed,
      },
      {
        jobId: `podcast-${podcast.id}`,
        priority: user.role === "PREMIUM" ? 1 : 5,
      }
    );

    logger.info(
      { podcastId: podcast.id, noteId: note.id, style: input.style },
      "Podcast kuyruğa eklendi"
    );

    res.status(HTTP_STATUS.CREATED).json({ success: true, data: { podcast } });
  } catch (err) {
    next(err);
  }
}

// ──────── Delete Handler ────────

/**
 * DELETE /api/podcasts/:id
 */
export async function deletePodcastHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const podcast = await findPodcastById(id, user.id);
    if (!podcast) return next(AppError.notFound("Podcast"));

    // S3'ten ses dosyasını sil
    if (podcast.audioUrl) {
      await deleteObject(podcast.audioUrl).catch((err) => {
        logger.warn({ err, podcastId: id }, "Ses dosyası S3'ten silinemedi");
      });
    }

    await deletePodcast(id);

    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

// ──────── Regenerate Handler ────────

/**
 * POST /api/podcasts/:id/regenerate
 */
export async function regeneratePodcastHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const podcast = await findPodcastById(id, user.id);
    if (!podcast) return next(AppError.notFound("Podcast"));

    if (["SCRIPT_WRITING", "GENERATING_AUDIO", "MERGING"].includes(podcast.status)) {
      return next(AppError.badRequest("Podcast zaten oluşturuluyor"));
    }

    // Durumu sıfırla
    await updatePodcast(id, {
      status: "PENDING",
      errorMessage: null,
      scriptText: null,
      audioUrl: null,
      audioDuration: null,
      audioSizeBytes: null,
    });

    // Yeniden kuyruğa ekle
    await podcastGenerationQueue.add(
      "generate-podcast",
      {
        podcastId: podcast.id,
        userId: user.id,
        noteId: podcast.noteId,
        voiceId: podcast.voiceId,
        style: podcast.style as "educational" | "conversational" | "summary",
        speed: podcast.speed,
      },
      { jobId: `podcast-regen-${podcast.id}-${Date.now()}` }
    );

    res.json({ success: true, data: { message: "Podcast yeniden oluşturuluyor" } });
  } catch (err) {
    next(err);
  }
}

// ──────── Script Preview Handler ────────

/**
 * GET /api/podcasts/:id/script
 * Podcast script metnini döndürür
 */
export async function getPodcastScriptHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const podcast = await findPodcastById(id, user.id);
    if (!podcast) return next(AppError.notFound("Podcast"));

    res.json({
      success: true,
      data: { scriptText: podcast.scriptText },
    });
  } catch (err) {
    next(err);
  }
}

// ──────── Download Handler ────────

/**
 * GET /api/podcasts/:id/download
 * Ses dosyasını indirmeye yönlendirir (presigned URL)
 */
export async function downloadPodcastHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const podcast = await findPodcastById(id, user.id);
    if (!podcast) return next(AppError.notFound("Podcast"));
    if (!podcast.audioUrl) return next(AppError.badRequest("Ses dosyası henüz hazır değil"));

    const downloadUrl = await getPresignedDownloadUrl(podcast.audioUrl);
    res.redirect(downloadUrl);
  } catch (err) {
    next(err);
  }
}

// ──────── Stream Handler ────────

/**
 * GET /api/podcasts/:id/stream
 * Ses dosyasını streaming olarak sunar
 */
export async function streamPodcastHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const podcast = await findPodcastById(id, user.id);
    if (!podcast) return next(AppError.notFound("Podcast"));
    if (!podcast.audioUrl) return next(AppError.badRequest("Ses dosyası henüz hazır değil"));

    const audioBuffer = await downloadBuffer(podcast.audioUrl);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length.toString());
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="podcast-${id}.mp3"`
    );
    res.send(audioBuffer);
  } catch (err) {
    next(err);
  }
}

// ──────── Status Handler ────────

/**
 * GET /api/podcasts/:id/status
 */
export async function getPodcastStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const podcast = await findPodcastById(id, user.id);
    if (!podcast) return next(AppError.notFound("Podcast"));

    res.json({
      success: true,
      data: {
        id: podcast.id,
        status: podcast.status,
        errorMessage: podcast.errorMessage,
        audioUrl: podcast.audioUrl,
        audioDuration: podcast.audioDuration,
      },
    });
  } catch (err) {
    next(err);
  }
}
