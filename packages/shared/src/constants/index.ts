/**
 * NotCast — Paylaşılan sabitler
 */

// ──────── Dosya Limitleri ────────
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_PDF_SIZE_MB: 20,
  MAX_TEXT_SIZE_MB: 1,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_PDF_SIZE_BYTES: 20 * 1024 * 1024,
  MAX_TEXT_SIZE_BYTES: 1 * 1024 * 1024,
} as const;

// ──────── İzin Verilen MIME Tipleri ────────
export const ALLOWED_MIME_TYPES = {
  IMAGE: ["image/jpeg", "image/png", "image/webp", "image/heic"],
  PDF: ["application/pdf"],
  TEXT: ["text/plain"],
  DOCUMENT: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.IMAGE,
  ...ALLOWED_MIME_TYPES.PDF,
  ...ALLOWED_MIME_TYPES.TEXT,
  ...ALLOWED_MIME_TYPES.DOCUMENT,
] as const;

// ──────── ElevenLabs ────────
export const ELEVENLABS = {
  DEFAULT_MODEL: "eleven_multilingual_v2",
  FLASH_MODEL: "eleven_flash_v2_5",
  MAX_CHUNK_SIZE: 5000,
  DEFAULT_VOICE_SETTINGS: {
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.3,
    use_speaker_boost: true,
  },
  OUTPUT_FORMAT: "mp3_44100_128",
} as const;

// ──────── Üyelik Limitleri ────────
export const MEMBERSHIP_LIMITS = {
  FREE: {
    MONTHLY_PODCASTS: 3,
    MAX_FILE_SIZE_MB: 5,
    AVAILABLE_VOICES: 2,
    STYLES: ["educational"] as const,
  },
  PREMIUM: {
    MONTHLY_PODCASTS: Infinity,
    MAX_FILE_SIZE_MB: 20,
    AVAILABLE_VOICES: Infinity,
    STYLES: ["educational", "conversational", "summary"] as const,
  },
} as const;

// ──────── Podcast Stilleri ────────
export const PODCAST_STYLES = ["educational", "conversational", "summary"] as const;

// ──────── HTTP Status Kodları ────────
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ──────── Hata Kodları ────────
export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  INVALID_FILE_TYPE: "INVALID_FILE_TYPE",
  OCR_FAILED: "OCR_FAILED",
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  TTS_SERVICE_ERROR: "TTS_SERVICE_ERROR",
  STORAGE_ERROR: "STORAGE_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ──────── WebSocket Events ────────
export const WS_EVENTS = {
  // Sunucudan istemciye
  NOTE_PROCESSING_PROGRESS: "note:processing:progress",
  NOTE_PROCESSING_COMPLETE: "note:processing:complete",
  NOTE_PROCESSING_ERROR: "note:processing:error",
  PODCAST_GENERATION_PROGRESS: "podcast:generation:progress",
  PODCAST_GENERATION_COMPLETE: "podcast:generation:complete",
  PODCAST_GENERATION_ERROR: "podcast:generation:error",
  // İstemciden sunucuya
  SUBSCRIBE_NOTE: "subscribe:note",
  SUBSCRIBE_PODCAST: "subscribe:podcast",
} as const;
