/**
 * NotCast — Paylaşılan TypeScript tipleri
 * Frontend ve Backend arasında ortak kullanılan tip tanımları
 */

// ──────── Enum Tipleri ────────

export type UserRole = "FREE" | "PREMIUM" | "ADMIN";

export type NoteStatus =
  | "UPLOADED"
  | "PREPROCESSING"
  | "OCR_PROCESSING"
  | "TEXT_EXTRACTED"
  | "ANALYZING"
  | "READY"
  | "ERROR";

export type PodcastStatus =
  | "PENDING"
  | "SCRIPT_WRITING"
  | "GENERATING_AUDIO"
  | "MERGING"
  | "READY"
  | "ERROR";

export type UploadType = "IMAGE" | "PDF" | "TEXT" | "DOCUMENT";

export type PodcastStyle = "educational" | "conversational" | "summary";

// ──────── Model Tipleri ────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  emailVerified: boolean;
  preferredVoiceId: string | null;
  monthlyCredits: number;
  creditsUsed: number;
  creditsResetAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteSection {
  title: string;
  content: string;
  order: number;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  uploadType: UploadType;
  originalFileUrl: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  status: NoteStatus;
  rawExtractedText: string | null;
  processedText: string | null;
  sections: NoteSection[] | null;
  tags: string[];
  subject: string | null;
  errorMessage: string | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Podcast {
  id: string;
  userId: string;
  noteId: string;
  title: string;
  description: string | null;
  voiceId: string;
  voiceName: string;
  status: PodcastStatus;
  scriptText: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
  audioSizeBytes: number | null;
  speed: number;
  style: PodcastStyle;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Voice {
  id: string;
  elevenLabsId: string;
  name: string;
  description: string | null;
  gender: string;
  accent: string;
  previewUrl: string | null;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

// ──────── API Response Tipleri ────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CursorPaginationMeta {
  cursor: string | null;
  hasNextPage: boolean;
  limit: number;
}

// ──────── Auth Tipleri ────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser extends User {
  tokens: AuthTokens;
}

// ──────── İşlem Durumu Tipleri (WebSocket) ────────

export interface ProcessingProgress {
  noteId: string;
  status: NoteStatus;
  progress: number; // 0–100
  message: string;
}

export interface PodcastProgress {
  podcastId: string;
  status: PodcastStatus;
  progress: number; // 0–100
  message: string;
}
