/**
 * Frontend'e özgü TypeScript tipleri
 * Shared tipler @notcast/shared'dan import edilir
 */

export type { User, Note, Podcast, Voice, NoteSection } from "@notcast/shared";

// ──────── UI Tipleri ────────

export interface UploadState {
  file: File | null;
  preview: string | null;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  error: string | null;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  speed: number;
  podcastId: string | null;
}
