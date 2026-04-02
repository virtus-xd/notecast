/**
 * OCR Processor
 * Dosya türüne göre doğru OCR stratejisini seçer ve çalıştırır
 *
 * Strateji:
 *   IMAGE → Google Vision (fallback: Tesseract)
 *   PDF   → pdf-parse (metin tabanlıysa), taranmışsa → Vision (fallback: Tesseract)
 *   TEXT  → Doğrudan S3'ten oku
 *   DOCX  → Placeholder (ileride mammoth.js)
 */

import { extractTextFromImage, isGoogleVisionAvailable } from "../../../shared/services/google-vision.service";
import { extractTextWithTesseract } from "../../../shared/services/tesseract.service";
import { extractTextFromPdf } from "../../../shared/services/pdf.service";
import { preprocessImage, isImageFile } from "./image-preprocessor";
import { logger } from "../../../shared/utils/logger";

// Güvenilir kabul edilecek minimum güven skoru
const MIN_CONFIDENCE_THRESHOLD = 0.4;

// ──────── Tipler ────────

export interface OcrProcessorResult {
  text: string;
  confidence: number;
  pageCount: number;
  provider: "google-vision" | "tesseract" | "direct" | "pdf-parse";
  warnings: string[];
}

// ──────── Ana İşlev ────────

/**
 * Dosya türüne göre OCR uygular ve ham metni döndürür
 */
export async function runOcr(
  fileBuffer: Buffer,
  mimeType: string
): Promise<OcrProcessorResult> {
  const warnings: string[] = [];

  // ── Düz metin ──
  if (mimeType === "text/plain") {
    const text = fileBuffer.toString("utf-8").trim();
    return { text, confidence: 1, pageCount: 1, provider: "direct", warnings };
  }

  // ── PDF ──
  if (mimeType === "application/pdf") {
    return runPdfOcr(fileBuffer, warnings);
  }

  // ── Görsel (JPEG, PNG, WEBP, HEIC) ──
  if (isImageFile(mimeType)) {
    return runImageOcr(fileBuffer, mimeType, warnings);
  }

  // ── DOCX / DOC — placeholder ──
  warnings.push("DOCX/DOC desteği yakında eklenecek. Metin çıkarılamadı.");
  return { text: "", confidence: 0, pageCount: 0, provider: "direct", warnings };
}

// ──────── PDF İşleme ──────────────────────────────────────────────

async function runPdfOcr(
  pdfBuffer: Buffer,
  warnings: string[]
): Promise<OcrProcessorResult> {
  // 1. Doğrudan metin çıkarmayı dene
  const pdfResult = await extractTextFromPdf(pdfBuffer);

  if (pdfResult.isTextBased && pdfResult.text.length > 0) {
    logger.debug({ pageCount: pdfResult.pageCount }, "PDF: metin tabanlı, doğrudan çıkarıldı");
    return {
      text: pdfResult.text,
      confidence: 0.95, // Metin tabanlı PDF güvenilir
      pageCount: pdfResult.pageCount,
      provider: "pdf-parse",
      warnings,
    };
  }

  // 2. Taranmış PDF → uyarı ekle, boş metin döndür
  // (Gerçek render için pdf-poppler gerekli — PART 5+ için)
  warnings.push(
    pdfResult.pageCount > 0
      ? "Bu PDF taranmış görüntü içeriyor. OCR kalitesi düşük olabilir."
      : "PDF okunamadı."
  );

  logger.warn({ pageCount: pdfResult.pageCount }, "PDF: taranmış veya boş — OCR uygulanamadı");

  return {
    text: pdfResult.text || "",
    confidence: 0.3,
    pageCount: pdfResult.pageCount,
    provider: "pdf-parse",
    warnings,
  };
}

// ──────── Görsel İşleme ──────────────────────────────────────────

async function runImageOcr(
  imageBuffer: Buffer,
  mimeType: string,
  warnings: string[]
): Promise<OcrProcessorResult> {
  // Görsel ön işleme
  const preprocessed = await preprocessImage(imageBuffer, mimeType, {
    forOcr: true,
    grayscale: true,
  });

  const bufferToOcr = preprocessed.buffer;

  // ── Google Vision (birincil) ──
  if (isGoogleVisionAvailable()) {
    try {
      const result = await extractTextFromImage(bufferToOcr);

      if (result.text && result.confidence >= MIN_CONFIDENCE_THRESHOLD) {
        return {
          text: result.text,
          confidence: result.confidence,
          pageCount: result.pageCount,
          provider: "google-vision",
          warnings,
        };
      }

      if (result.text && result.confidence < MIN_CONFIDENCE_THRESHOLD) {
        warnings.push(
          `OCR güven skoru düşük (${(result.confidence * 100).toFixed(0)}%). Metin hatalı olabilir.`
        );
        return {
          text: result.text,
          confidence: result.confidence,
          pageCount: result.pageCount,
          provider: "google-vision",
          warnings,
        };
      }

      // Boş sonuç — Tesseract'a geç
      warnings.push("Google Vision metin bulamadı, Tesseract deneniyor...");
    } catch (err) {
      logger.warn({ err }, "Google Vision başarısız, Tesseract fallback");
      warnings.push("Google Vision API hatası — Tesseract yedek olarak kullanıldı");
    }
  } else {
    warnings.push("Google Vision yapılandırılmamış — Tesseract kullanılıyor");
  }

  // ── Tesseract (fallback) ──
  const tessResult = await extractTextWithTesseract(bufferToOcr);

  if (!tessResult.text) {
    warnings.push("Görselden metin çıkarılamadı. Görsel kalitesini kontrol edin.");
  }

  return {
    text: tessResult.text,
    confidence: tessResult.confidence,
    pageCount: 1,
    provider: "tesseract",
    warnings,
  };
}
