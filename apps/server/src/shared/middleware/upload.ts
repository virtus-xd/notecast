/**
 * Multer upload middleware
 * Magic bytes validasyonu, boyut limiti, memory storage
 */

import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";
import { AppError } from "../utils/errors";
import { ERROR_CODES, ALLOWED_MIME_TYPES } from "@notcast/shared";

// ──────── Magic Bytes Tanımları ────────
// İlk N byte ile dosya tipini güvenle doğrula

interface MagicPattern {
  bytes: number[];
  offset?: number;
}

const MAGIC_BYTES: Record<string, MagicPattern[]> = {
  "image/jpeg": [{ bytes: [0xff, 0xd8, 0xff] }],
  "image/png": [{ bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  "image/webp": [
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
    { bytes: [0x57, 0x45, 0x42, 0x50], offset: 8 }, // WEBP
  ],
  "application/pdf": [{ bytes: [0x25, 0x50, 0x44, 0x46] }], // %PDF
  // DOCX/ZIP formatı
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    { bytes: [0x50, 0x4b, 0x03, 0x04] },
  ],
  "application/msword": [{ bytes: [0xd0, 0xcf, 0x11, 0xe0] }],
  // Text: magic bytes yok — uzantı + content-type yeterli
  "text/plain": [],
};

// ──────── Boyut Limitleri (bytes) ────────
const SIZE_LIMITS: Record<string, number> = {
  "image/jpeg": env.MAX_IMAGE_SIZE_MB * 1024 * 1024,
  "image/png": env.MAX_IMAGE_SIZE_MB * 1024 * 1024,
  "image/webp": env.MAX_IMAGE_SIZE_MB * 1024 * 1024,
  "image/heic": env.MAX_IMAGE_SIZE_MB * 1024 * 1024,
  "application/pdf": env.MAX_PDF_SIZE_MB * 1024 * 1024,
  "text/plain": env.MAX_TEXT_SIZE_MB * 1024 * 1024,
  "application/msword": env.MAX_PDF_SIZE_MB * 1024 * 1024,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    env.MAX_PDF_SIZE_MB * 1024 * 1024,
};

// ──────── İzin Verilen MIME tipleri (flat list) ────────
const ALLOWED_MIMES = new Set<string>([
  ...ALLOWED_MIME_TYPES.IMAGE,
  ...ALLOWED_MIME_TYPES.PDF,
  ...ALLOWED_MIME_TYPES.TEXT,
  ...ALLOWED_MIME_TYPES.DOCUMENT,
]);

// ──────── Magic Bytes Doğrulama ────────

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const patterns = MAGIC_BYTES[mimeType];

  // Tanımsız tip veya boş pattern listesi — kabul et (text/plain gibi)
  if (!patterns || patterns.length === 0) return true;

  // Tüm pattern grupları eşleşmeli (AND mantığı — WEBP için gerekli)
  if (mimeType === "image/webp") {
    const [riff, webp] = patterns;
    return (
      matchPattern(buffer, riff.bytes, riff.offset ?? 0) &&
      matchPattern(buffer, webp!.bytes, webp!.offset ?? 0)
    );
  }

  // Tek pattern grubu
  return matchPattern(buffer, patterns[0]!.bytes, patterns[0]!.offset ?? 0);
}

function matchPattern(buffer: Buffer, pattern: number[], offset: number): boolean {
  if (buffer.length < offset + pattern.length) return false;
  return pattern.every((byte, i) => buffer[offset + i] === byte);
}

// ──────── Multer Konfigürasyonu ────────

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    // En büyük boyutu kullan — her tipe göre ayrıca kontrol edilecek
    fileSize: Math.max(...Object.values(SIZE_LIMITS)),
    files: 1,
  },
  fileFilter(_req, file, cb) {
    // MIME tip kontrolü (Content-Type header'ına göre)
    if (!ALLOWED_MIMES.has(file.mimetype)) {
      return cb(
        new AppError(
          `Desteklenmeyen dosya türü: ${file.mimetype}`,
          400,
          ERROR_CODES.INVALID_FILE_TYPE
        )
      );
    }
    cb(null, true);
  },
});

// ──────── Dosya Doğrulama Middleware ────────

/**
 * Magic bytes + boyut doğrulaması
 * Multer'dan sonra çalışır
 */
export function validateUploadedFile(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const file = req.file;

  if (!file) {
    return next(
      new AppError("Dosya bulunamadı", 400, ERROR_CODES.VALIDATION_ERROR)
    );
  }

  // MIME tip kontrolü (ikinci katman)
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    return next(
      new AppError(
        "Desteklenmeyen dosya türü",
        400,
        ERROR_CODES.INVALID_FILE_TYPE
      )
    );
  }

  // Boyut limiti (tipe özgü)
  const limit = SIZE_LIMITS[file.mimetype];
  if (limit && file.size > limit) {
    const limitMB = Math.round(limit / 1024 / 1024);
    return next(
      new AppError(
        `Dosya çok büyük. Maksimum: ${limitMB}MB`,
        400,
        ERROR_CODES.FILE_TOO_LARGE
      )
    );
  }

  // Magic bytes kontrolü (text/plain hariç)
  if (file.mimetype !== "text/plain") {
    const isValid = validateMagicBytes(file.buffer, file.mimetype);
    if (!isValid) {
      return next(
        new AppError(
          "Dosya içeriği, belirtilen türle eşleşmiyor",
          400,
          ERROR_CODES.INVALID_FILE_TYPE
        )
      );
    }
  }

  next();
}

// ──────── Dosya Adı Temizleme ────────

/**
 * Dosya adını güvenli hale getirir
 * Path traversal ve özel karakter saldırılarını önler
 */
export function sanitizeFileName(name: string): string {
  return name
    .replace(/[^\w\s.-]/g, "") // Alfanümerik, boşluk, nokta, tire
    .replace(/\s+/g, "_")      // Boşlukları alt çizgiye çevir
    .replace(/\.{2,}/g, ".")   // Çift nokta engelle
    .slice(0, 255);             // Maksimum uzunluk
}
