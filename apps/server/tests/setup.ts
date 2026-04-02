/**
 * Vitest global test setup
 * Her test dosyasından önce çalışır
 */

import { vi } from "vitest";

// ──────── Ortam Değişkenleri ────────
// Test ortamı için minimal .env değerleri

process.env["NODE_ENV"] = "test";
process.env["DATABASE_URL"] = "postgresql://test:test@localhost:5432/notcast_test";
process.env["REDIS_URL"] = "redis://localhost:6379/1";
process.env["JWT_SECRET"] = "test-jwt-secret-minimum-32-chars-long!!";
process.env["JWT_REFRESH_SECRET"] = "test-jwt-refresh-secret-minimum-32-chars!!";
process.env["JWT_ACCESS_EXPIRY"] = "15m";
process.env["JWT_REFRESH_EXPIRY"] = "7d";
process.env["FRONTEND_URL"] = "http://localhost:3000";
process.env["CORS_ORIGINS"] = "http://localhost:3000";
process.env["S3_ENDPOINT"] = "http://localhost:9000";
process.env["S3_ACCESS_KEY"] = "minioadmin";
process.env["S3_SECRET_KEY"] = "minioadmin";
process.env["S3_BUCKET"] = "notcast-test";
process.env["S3_REGION"] = "us-east-1";
process.env["ELEVENLABS_API_KEY"] = "test-elevenlabs-key";
process.env["ANTHROPIC_API_KEY"] = "test-anthropic-key";
process.env["PORT"] = "3002";

// ──────── Global Mock'lar ────────

// Prisma'yı mock'la (gerçek DB bağlantısı gerekmez)
vi.mock("../src/config/database", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    note: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    podcast: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    session: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    voice: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fns: unknown) =>
      Array.isArray(fns) ? Promise.all(fns) : (fns as () => unknown)()
    ),
  },
  checkDatabaseConnection: vi.fn().mockResolvedValue(true),
}));

// Redis'i mock'la
vi.mock("../src/config/redis", () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue("OK"),
    del: vi.fn().mockResolvedValue(1),
    setex: vi.fn().mockResolvedValue("OK"),
    quit: vi.fn().mockResolvedValue("OK"),
  },
  disconnectRedis: vi.fn(),
}));

// S3 Storage'ı mock'la
vi.mock("../src/shared/services/storage.service", () => ({
  uploadBuffer: vi.fn().mockResolvedValue({ key: "test/file.jpg", sizeBytes: 1024 }),
  downloadBuffer: vi.fn().mockResolvedValue(Buffer.from("test")),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  getPresignedDownloadUrl: vi.fn().mockResolvedValue("https://s3.example.com/test"),
  ensureBucketExists: vi.fn().mockResolvedValue(undefined),
}));

// Bull Queue'ları mock'la
vi.mock("../src/jobs/queue", () => ({
  noteProcessingQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-1" }),
    process: vi.fn(),
    on: vi.fn(),
  },
  podcastGenerationQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-2" }),
    process: vi.fn(),
    on: vi.fn(),
  },
}));

// Socket.IO'yu mock'la
vi.mock("../src/shared/utils/socket-events", () => ({
  emitNoteProgress: vi.fn(),
  emitNoteComplete: vi.fn(),
  emitNoteError: vi.fn(),
  emitPodcastProgress: vi.fn(),
  emitPodcastComplete: vi.fn(),
  emitPodcastError: vi.fn(),
}));

// Logger'ı sustur
vi.mock("../src/shared/utils/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
  },
}));

// Worker'ları mock'la (app.ts başlatmasın)
vi.mock("../src/jobs/note-processing.job", () => ({
  startNoteProcessingWorker: vi.fn(),
}));

vi.mock("../src/jobs/podcast-generation.job", () => ({
  startPodcastGenerationWorker: vi.fn(),
}));

// ensureBucketExists mock (app.ts içinde çağrılır)
vi.mock("../src/shared/services/storage.service");
