/**
 * Notes Route'ları
 * /api/notes prefix'i ile kullanılır
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { uploadMiddleware, validateUploadedFile } from "../../shared/middleware/upload";
import { uploadRateLimiter } from "../../shared/middleware/rate-limiter";
import {
  uploadNoteHandler,
  listNotesHandler,
  getNoteHandler,
  updateNoteHandler,
  deleteNoteHandler,
  getNoteStatusHandler,
  reprocessNoteHandler,
} from "./note.controller";

export const notesRouter = Router();

// Tüm note route'ları auth gerektirir
notesRouter.use(requireAuth);

// Not listesi
notesRouter.get("/", listNotesHandler);

// Tek not detayı
notesRouter.get("/:id", getNoteHandler);

// Not yükleme (rate limit + multer + magic bytes validasyon)
notesRouter.post(
  "/upload",
  uploadRateLimiter,
  uploadMiddleware.single("file"),
  validateUploadedFile,
  uploadNoteHandler
);

// Not güncelleme
notesRouter.patch("/:id", updateNoteHandler);

// Not silme
notesRouter.delete("/:id", deleteNoteHandler);

// Not durumu
notesRouter.get("/:id/status", getNoteStatusHandler);

// Yeniden işle
notesRouter.post("/:id/reprocess", reprocessNoteHandler);
