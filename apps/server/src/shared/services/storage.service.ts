/**
 * Storage Service — S3/MinIO operasyonları
 * Dosya yükleme, indirme, silme ve presigned URL
 */

import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, S3_BUCKET } from "../../config/storage";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";
import path from "path";
import crypto from "crypto";

// Presigned URL geçerlilik süresi (saniye)
const PRESIGNED_URL_TTL = 60 * 60; // 1 saat

// ──────── Tipler ────────

export interface UploadResult {
  key: string;         // S3 object key
  url: string;         // Erişim URL'si
  sizeBytes: number;
  mimeType: string;
}

export interface UploadOptions {
  folder?: string;     // Örn: "notes/images"
  fileName?: string;   // Override dosya adı (varsayılan: uuid)
  public?: boolean;    // Public erişim
  metadata?: Record<string, string>;
}

// ──────── Bucket Yönetimi ────────

/**
 * Bucket mevcut değilse oluştur (uygulama başlarken çağrılır)
 */
export async function ensureBucketExists(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    logger.debug({ bucket: S3_BUCKET }, "S3 bucket mevcut");
  } catch {
    logger.info({ bucket: S3_BUCKET }, "S3 bucket oluşturuluyor...");
    await s3Client.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
    logger.info({ bucket: S3_BUCKET }, "S3 bucket oluşturuldu");
  }
}

// ──────── Upload ────────

/**
 * Buffer'ı S3'e yükle
 */
export async function uploadBuffer(
  buffer: Buffer,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { folder = "uploads", fileName, metadata = {} } = options;

  // Benzersiz dosya adı oluştur
  const ext = getExtensionForMime(mimeType);
  const objectName = fileName ?? `${crypto.randomUUID()}${ext}`;
  const key = `${folder}/${objectName}`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        Metadata: metadata,
      })
    );

    const url = buildObjectUrl(key);
    logger.debug({ key, sizeBytes: buffer.length }, "S3 upload başarılı");

    return {
      key,
      url,
      sizeBytes: buffer.length,
      mimeType,
    };
  } catch (err) {
    logger.error({ err, key }, "S3 upload hatası");
    throw AppError.internal("Dosya yükleme sırasında hata oluştu");
  }
}

// ──────── Download ────────

/**
 * S3'ten buffer olarak indir
 */
export async function downloadBuffer(key: string): Promise<Buffer> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key })
    );

    if (!response.Body) {
      throw AppError.notFound("Dosya");
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error({ err, key }, "S3 download hatası");
    throw AppError.notFound("Dosya");
  }
}

// ──────── Delete ────────

/**
 * S3'ten dosyayı sil
 */
export async function deleteObject(key: string): Promise<void> {
  try {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key })
    );
    logger.debug({ key }, "S3 dosyası silindi");
  } catch (err) {
    logger.error({ err, key }, "S3 silme hatası");
    // Silme hatası kritik değil — loglayıp devam et
  }
}

/**
 * Birden fazla dosyayı sil
 */
export async function deleteObjects(keys: string[]): Promise<void> {
  await Promise.allSettled(keys.map((key) => deleteObject(key)));
}

// ──────── Presigned URL ────────

/**
 * Geçici erişim URL'si üret (özel dosyalar için)
 */
export async function getPresignedDownloadUrl(
  key: string,
  ttlSeconds = PRESIGNED_URL_TTL
): Promise<string> {
  try {
    return await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
      { expiresIn: ttlSeconds }
    );
  } catch (err) {
    logger.error({ err, key }, "Presigned URL hatası");
    throw AppError.internal("Dosya erişim URL'si oluşturulamadı");
  }
}

// ──────── Metadata ────────

/**
 * Dosya meta bilgilerini al
 */
export async function getObjectMetadata(
  key: string
): Promise<{ sizeBytes: number; mimeType: string; lastModified: Date } | null> {
  try {
    const response = await s3Client.send(
      new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key })
    );
    return {
      sizeBytes: response.ContentLength ?? 0,
      mimeType: response.ContentType ?? "application/octet-stream",
      lastModified: response.LastModified ?? new Date(),
    };
  } catch {
    return null;
  }
}

// ──────── Yardımcı fonksiyonlar ────────

/**
 * S3 key'den erişim URL'si oluştur
 */
function buildObjectUrl(key: string): string {
  const endpoint = process.env["S3_ENDPOINT"] ?? "http://localhost:9000";
  return `${endpoint}/${S3_BUCKET}/${key}`;
}

/**
 * MIME type'a göre dosya uzantısı döner
 */
function getExtensionForMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
  };
  return map[mimeType] ?? path.extname(mimeType) ?? "";
}

/**
 * S3 key'den klasör yolunu çıkarır
 */
export function extractFolder(key: string): string {
  return path.dirname(key);
}
