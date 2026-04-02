/**
 * Görsel ön işleme — Sharp
 * OCR kalitesini artırmak için görsel optimizasyonu
 */

import sharp from "sharp";
import { logger } from "../../../shared/utils/logger";

// ──────── Sabitler ────────

// OCR için maksimum boyut (çok büyük görseller API limiti aşar)
const MAX_OCR_DIMENSION = 4096;

// Minimum boyut (çok küçük görseller OCR hatası verir)
const MIN_OCR_DIMENSION = 300;

// ──────── Tipler ────────

export interface PreprocessResult {
  buffer: Buffer;
  width: number;
  height: number;
  channels: number;
  sizeBytes: number;
  wasProcessed: boolean;
}

export interface PreprocessOptions {
  /** OCR moduna göre optimize et (kontrat artır, gürültü azalt) */
  forOcr?: boolean;
  /** Grayscale'e çevir (el yazısı OCR için daha iyi) */
  grayscale?: boolean;
  /** Maksimum boyut (px) */
  maxDimension?: number;
}

// ──────── Ana İşleme Fonksiyonu ────────

/**
 * Görsel buffer'ı OCR için optimize eder
 */
export async function preprocessImage(
  inputBuffer: Buffer,
  mimeType: string,
  options: PreprocessOptions = {}
): Promise<PreprocessResult> {
  const {
    forOcr = true,
    grayscale = true,
    maxDimension = MAX_OCR_DIMENSION,
  } = options;

  try {
    let pipeline = sharp(inputBuffer, { failOnError: false });

    // EXIF rotasyon düzeltmesi (kameradan çekilen fotoğraflar)
    pipeline = pipeline.rotate();

    // Boyut bilgisi al
    const metadata = await pipeline.metadata();
    const origWidth = metadata.width ?? 0;
    const origHeight = metadata.height ?? 0;

    logger.debug(
      { origWidth, origHeight, format: metadata.format },
      "Görsel ön işleme başladı"
    );

    // Boyutlandırma — çok büyük ise küçült
    if (origWidth > maxDimension || origHeight > maxDimension) {
      pipeline = pipeline.resize(maxDimension, maxDimension, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Çok küçük ise büyüt (OCR kalitesi için)
    if (origWidth < MIN_OCR_DIMENSION || origHeight < MIN_OCR_DIMENSION) {
      const scale = MIN_OCR_DIMENSION / Math.min(origWidth, origHeight);
      pipeline = pipeline.resize(
        Math.round(origWidth * scale),
        Math.round(origHeight * scale),
        { fit: "fill" }
      );
    }

    if (forOcr) {
      // Grayscale dönüşüm
      if (grayscale) {
        pipeline = pipeline.grayscale();
      }

      // Normalize — parlaklık/kontrastı normalize et
      pipeline = pipeline.normalize();

      // Keskinlik artırma — metin kenarlarını belirginleştir
      pipeline = pipeline.sharpen({ sigma: 1.0 });

      // Gürültü azaltma (hafif blur)
      pipeline = pipeline.median(1);
    }

    // PNG olarak çıkar (lossless — OCR için daha iyi)
    const outputBuffer = await pipeline
      .png({ compressionLevel: 6 })
      .toBuffer({ resolveWithObject: true });

    logger.debug(
      {
        origSize: inputBuffer.length,
        newSize: outputBuffer.data.length,
        width: outputBuffer.info.width,
        height: outputBuffer.info.height,
      },
      "Görsel ön işleme tamamlandı"
    );

    return {
      buffer: outputBuffer.data,
      width: outputBuffer.info.width,
      height: outputBuffer.info.height,
      channels: outputBuffer.info.channels,
      sizeBytes: outputBuffer.data.length,
      wasProcessed: true,
    };
  } catch (err) {
    logger.error({ err }, "Görsel ön işleme hatası — orijinal buffer kullanılıyor");
    // Hata durumunda orijinal buffer'ı döndür
    return {
      buffer: inputBuffer,
      width: 0,
      height: 0,
      channels: 0,
      sizeBytes: inputBuffer.length,
      wasProcessed: false,
    };
  }
}

/**
 * Thumbnail oluştur (frontend önizleme için)
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  size = 200
): Promise<Buffer> {
  return sharp(inputBuffer)
    .rotate()
    .resize(size, size, { fit: "cover" })
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * PDF sayfalarını ayrı görsel buffer'lara dönüştürür
 * Not: Bu işlem için sharp yeterli değil — PART 5'te pdf-lib/poppler kullanılacak
 */
export function isPdfFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

/**
 * Görsel mi değil mi
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}
