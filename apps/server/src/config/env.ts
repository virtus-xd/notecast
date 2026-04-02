/**
 * Ortam değişkeni validasyonu ve yüklenmesi
 * Uygulama başlamadan önce tüm zorunlu değişkenler kontrol edilir
 */

import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
  // Uygulama
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_URL: z.string().url(),
  CORS_ORIGINS: z.string(),

  // Veritabanı
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string(),

  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET en az 32 karakter olmalı"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET en az 32 karakter olmalı"),
  JWT_ACCESS_EXPIRY: z.string().default("7d"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),

  // Storage (S3/MinIO)
  S3_ENDPOINT: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  S3_BUCKET: z.string(),
  S3_REGION: z.string().default("us-east-1"),

  // ElevenLabs
  ELEVENLABS_API_KEY: z.string(),
  ELEVENLABS_DEFAULT_MODEL: z.string().default("eleven_multilingual_v2"),
  ELEVENLABS_MAX_CHUNK_SIZE: z.coerce.number().int().positive().default(5000),

  // Claude (Anthropic)
  ANTHROPIC_API_KEY: z.string(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-20250514"),
  ANTHROPIC_MAX_TOKENS: z.coerce.number().int().positive().default(4096),

  // Google Cloud Vision (opsiyonel — fallback mevcutsa)
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),

  // Email (opsiyonel)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(100),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  UPLOAD_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  // Dosya Boyutu
  MAX_IMAGE_SIZE_MB: z.coerce.number().int().positive().default(10),
  MAX_PDF_SIZE_MB: z.coerce.number().int().positive().default(20),
  MAX_TEXT_SIZE_MB: z.coerce.number().int().positive().default(1),

  // Bull Queue
  BULL_CONCURRENCY: z.coerce.number().int().positive().default(3),
  JOB_RETRY_ATTEMPTS: z.coerce.number().int().positive().default(3),
  JOB_RETRY_DELAY_MS: z.coerce.number().int().positive().default(5000),
});

const parseResult = EnvSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("❌ Ortam değişkeni validasyon hatası:");
  console.error(parseResult.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parseResult.data;

export type Env = typeof env;
