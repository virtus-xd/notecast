/**
 * Socket.IO event yayınlama yardımcıları
 * İş süreçlerinden (job worker) frontend'e realtime bildirim
 */

import type { NoteStatus, PodcastStatus } from "@prisma/client";
import { WS_EVENTS } from "@notcast/shared";

// io instance'ına dinamik erişim — circular import önlemek için
function getIo() {
  // app.ts'te export edilen io instance'ı
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("../../app").io as import("socket.io").Server;
}

// ──────── Not Bildirimleri ────────

/**
 * Not işleme ilerlemesini bildir
 */
export function emitNoteProgress(
  userId: string,
  noteId: string,
  status: NoteStatus,
  progress: number,
  message: string
): void {
  try {
    const io = getIo();
    io.to(`note:${noteId}`).emit(WS_EVENTS.NOTE_PROCESSING_PROGRESS, {
      noteId,
      status,
      progress,
      message,
    });
    // Kullanıcı odasına da gönder (birden fazla sekmede açıksa)
    io.to(`user:${userId}`).emit(WS_EVENTS.NOTE_PROCESSING_PROGRESS, {
      noteId,
      status,
      progress,
      message,
    });
  } catch {
    // Socket.IO başlatılmamışsa sessizce devam et
  }
}

/**
 * Not işleme tamamlandı bildirimi
 */
export function emitNoteComplete(userId: string, noteId: string, status: NoteStatus): void {
  try {
    const io = getIo();
    const payload = { noteId, status, progress: 100, message: "İşleme tamamlandı" };
    io.to(`note:${noteId}`).emit(WS_EVENTS.NOTE_PROCESSING_COMPLETE, payload);
    io.to(`user:${userId}`).emit(WS_EVENTS.NOTE_PROCESSING_COMPLETE, payload);
  } catch {}
}

/**
 * Not işleme hatası bildirimi
 */
export function emitNoteError(userId: string, noteId: string, errorMessage: string): void {
  try {
    const io = getIo();
    const payload = { noteId, status: "ERROR" as NoteStatus, progress: 0, message: errorMessage };
    io.to(`note:${noteId}`).emit(WS_EVENTS.NOTE_PROCESSING_ERROR, payload);
    io.to(`user:${userId}`).emit(WS_EVENTS.NOTE_PROCESSING_ERROR, payload);
  } catch {}
}

// ──────── Podcast Bildirimleri ────────

/**
 * Podcast oluşturma ilerlemesini bildir
 */
export function emitPodcastProgress(
  userId: string,
  podcastId: string,
  status: PodcastStatus,
  progress: number,
  message: string
): void {
  try {
    const io = getIo();
    const payload = { podcastId, status, progress, message };
    io.to(`podcast:${podcastId}`).emit(WS_EVENTS.PODCAST_GENERATION_PROGRESS, payload);
    io.to(`user:${userId}`).emit(WS_EVENTS.PODCAST_GENERATION_PROGRESS, payload);
  } catch {}
}

/**
 * Podcast oluşturma tamamlandı
 */
export function emitPodcastComplete(
  userId: string,
  podcastId: string,
  audioUrl: string
): void {
  try {
    const io = getIo();
    const payload = {
      podcastId,
      status: "READY" as PodcastStatus,
      progress: 100,
      message: "Podcast hazır!",
      audioUrl,
    };
    io.to(`podcast:${podcastId}`).emit(WS_EVENTS.PODCAST_GENERATION_COMPLETE, payload);
    io.to(`user:${userId}`).emit(WS_EVENTS.PODCAST_GENERATION_COMPLETE, payload);
  } catch {}
}

/**
 * Podcast oluşturma hatası
 */
export function emitPodcastError(
  userId: string,
  podcastId: string,
  errorMessage: string
): void {
  try {
    const io = getIo();
    const payload = {
      podcastId,
      status: "ERROR" as PodcastStatus,
      progress: 0,
      message: errorMessage,
    };
    io.to(`podcast:${podcastId}`).emit(WS_EVENTS.PODCAST_GENERATION_ERROR, payload);
    io.to(`user:${userId}`).emit(WS_EVENTS.PODCAST_GENERATION_ERROR, payload);
  } catch {}
}
