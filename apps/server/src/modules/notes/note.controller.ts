/**
 * Note Controller
 * Dosya yükleme ve not yönetimi
 */

import { Request, Response, NextFunction } from "express";
import { User, UploadType } from "@prisma/client";
import {
  createNote,
  findNoteById,
  findNotesByUserId,
  updateNote,
  deleteNote,
  findNotesByStatus,
} from "./note.repository";
import { uploadBuffer, deleteObject, getPresignedDownloadUrl } from "../../shared/services/storage.service";
import { sanitizeFileName } from "../../shared/middleware/upload";
import { preprocessImage, generateThumbnail, isImageFile, isPdfFile } from "./processors/image-preprocessor";
import { noteProcessingQueue } from "../../jobs/queue";
import { AppError } from "../../shared/utils/errors";
import { HTTP_STATUS, PaginationSchema, UpdateNoteSchema } from "@notcast/shared";
import { logger } from "../../shared/utils/logger";

// ──────── MIME → UploadType eşleştirme ────────

function resolveUploadType(mimeType: string): UploadType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "text/plain") return "TEXT";
  return "DOCUMENT";
}

// ──────── Upload Handler ────────

/**
 * POST /api/notes/upload
 * Multer file + optional text body
 */
export async function uploadNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const file = req.file;

    // TEXT tipi: dosya yerine body'den metin alınabilir
    const rawText = (req.body as { text?: string }).text;
    const title = (req.body as { title?: string }).title ?? "İsimsiz Not";

    if (!file && !rawText) {
      return next(AppError.badRequest("Dosya veya metin gerekli"));
    }

    let uploadResult;
    let mimeType: string;
    let originalFileName: string;
    let thumbnailKey: string | undefined;

    if (rawText) {
      // Düz metin girişi
      mimeType = "text/plain";
      originalFileName = "note.txt";
      const textBuffer = Buffer.from(rawText, "utf-8");

      uploadResult = await uploadBuffer(textBuffer, mimeType, {
        folder: `notes/${user.id}/text`,
      });
    } else {
      // Dosya yükleme
      mimeType = file!.mimetype;
      originalFileName = sanitizeFileName(file!.originalname);

      let fileBuffer = file!.buffer;

      // Görsel: ön işleme + thumbnail oluştur
      if (isImageFile(mimeType)) {
        const preprocessed = await preprocessImage(fileBuffer, mimeType, {
          forOcr: true,
          grayscale: true,
        });
        fileBuffer = preprocessed.buffer;

        // Thumbnail oluştur ve kaydet
        try {
          const thumbBuffer = await generateThumbnail(file!.buffer);
          const thumbResult = await uploadBuffer(thumbBuffer, "image/jpeg", {
            folder: `notes/${user.id}/thumbnails`,
          });
          thumbnailKey = thumbResult.key;
        } catch (thumbErr) {
          // Thumbnail başarısız olsa da devam et
          logger.warn({ err: thumbErr }, "Thumbnail oluşturulamadı");
        }

        // Görseller için MIME tipi PNG'ye güncelle (ön işleme sonrası)
        mimeType = "image/png";
      }

      uploadResult = await uploadBuffer(fileBuffer, mimeType, {
        folder: `notes/${user.id}/${resolveUploadType(mimeType).toLowerCase()}`,
        fileName: originalFileName,
        metadata: {
          userId: user.id,
          originalMime: file!.mimetype,
        },
      });
    }

    // Veritabanına kayıt
    const note = await createNote({
      userId: user.id,
      title: title.slice(0, 255),
      uploadType: resolveUploadType(mimeType),
      originalFileUrl: uploadResult.key,
      originalFileName,
      fileSizeBytes: uploadResult.sizeBytes,
      mimeType,
    });

    // İşleme kuyruğuna ekle
    await noteProcessingQueue.add(
      "process-note",
      {
        noteId: note.id,
        userId: user.id,
        fileKey: uploadResult.key,
        mimeType,
        rawText: rawText ?? null,
        thumbnailKey: thumbnailKey ?? null,
      },
      {
        jobId: `note-${note.id}`,
        priority: user.role === "PREMIUM" ? 1 : 5,
      }
    );

    logger.info(
      { noteId: note.id, userId: user.id, mimeType },
      "Not yüklendi, kuyruğa eklendi"
    );

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: { note },
    });
  } catch (err) {
    next(err);
  }
}

// ──────── List Handler ────────

/**
 * GET /api/notes
 */
export async function listNotesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { page, limit } = PaginationSchema.parse(req.query);
    const search = (req.query as Record<string, string>)["search"];

    const result = await findNotesByUserId({
      userId: user.id,
      page,
      limit,
      search,
    });

    res.json({
      success: true,
      data: result.notes,
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
 * GET /api/notes/:id
 */
export async function getNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const note = await findNoteById(id, user.id);
    if (!note) return next(AppError.notFound("Not"));

    // Dosya URL'sini presigned URL ile değiştir (güvenli erişim)
    const fileUrl = await getPresignedDownloadUrl(note.originalFileUrl).catch(() => null);

    res.json({
      success: true,
      data: { ...note, fileUrl },
    });
  } catch (err) {
    next(err);
  }
}

// ──────── Update Handler ────────

/**
 * PATCH /api/notes/:id
 */
export async function updateNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const existing = await findNoteById(id, user.id);
    if (!existing) return next(AppError.notFound("Not"));

    const input = UpdateNoteSchema.parse(req.body);
    const updated = await updateNote(id, input);

    res.json({ success: true, data: { note: updated } });
  } catch (err) {
    next(err);
  }
}

// ──────── Delete Handler ────────

/**
 * DELETE /api/notes/:id
 */
export async function deleteNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const note = await findNoteById(id, user.id);
    if (!note) return next(AppError.notFound("Not"));

    // S3'ten dosyayı sil
    await deleteObject(note.originalFileUrl);

    // DB kaydını sil (podcast'ler cascade ile silinir)
    await deleteNote(id);

    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) {
    next(err);
  }
}

// ──────── Status Handler ────────

/**
 * GET /api/notes/:id/status
 * Polling alternatifi (WebSocket yetersizse)
 */
export async function getNoteStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const note = await findNoteById(id, user.id);
    if (!note) return next(AppError.notFound("Not"));

    res.json({
      success: true,
      data: {
        id: note.id,
        status: note.status,
        errorMessage: note.errorMessage,
        processingStartedAt: note.processingStartedAt,
        processingCompletedAt: note.processingCompletedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ──────── Reprocess Handler ────────

/**
 * POST /api/notes/:id/reprocess
 */
export async function reprocessNoteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { id } = req.params as { id: string };

    const note = await findNoteById(id, user.id);
    if (!note) return next(AppError.notFound("Not"));

    if (note.status === "OCR_PROCESSING" || note.status === "ANALYZING" || note.status === "PREPROCESSING") {
      return next(AppError.badRequest("Not zaten işleniyor"));
    }

    await updateNote(id, { status: "UPLOADED", errorMessage: null });

    await noteProcessingQueue.add(
      "process-note",
      {
        noteId: note.id,
        userId: user.id,
        fileKey: note.originalFileUrl,
        mimeType: note.mimeType,
        rawText: null,
        thumbnailKey: null,
      },
      { jobId: `note-reprocess-${note.id}-${Date.now()}` }
    );

    res.json({
      success: true,
      data: { message: "Not yeniden işlemeye alındı" },
    });
  } catch (err) {
    next(err);
  }
}

// Kullanılmayan import'u sustur
void findNotesByStatus;
