/**
 * Google Cloud Vision API servisi
 * El yazısı dahil tüm metin çıkarma için birincil OCR
 */

import { ImageAnnotatorClient } from "@google-cloud/vision";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

// ──────── Client ────────

let _client: ImageAnnotatorClient | null = null;

function getClient(): ImageAnnotatorClient {
  if (_client) return _client;

  const credentialsPath = process.env["GOOGLE_APPLICATION_CREDENTIALS"];
  const projectId = process.env["GOOGLE_CLOUD_PROJECT_ID"];

  if (!credentialsPath || !projectId) {
    throw AppError.internal(
      "Google Cloud Vision yapılandırması eksik (GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT_ID)"
    );
  }

  _client = new ImageAnnotatorClient({
    keyFilename: credentialsPath,
    projectId,
  });

  return _client;
}

// ──────── Tipler ────────

export interface OcrResult {
  text: string;
  confidence: number;    // 0–1 ortalama güven skoru
  pageCount: number;
  provider: "google-vision";
}

// ──────── Görsel OCR ────────

/**
 * Görsel buffer'ından metin çıkar
 * DOCUMENT_TEXT_DETECTION: el yazısı + basılı metin, bağlam anlar
 */
export async function extractTextFromImage(imageBuffer: Buffer): Promise<OcrResult> {
  const client = getClient();

  try {
    const [result] = await client.documentTextDetection({
      image: { content: imageBuffer.toString("base64") },
      imageContext: {
        languageHints: ["tr", "en"], // Türkçe öncelikli, İngilizce fallback
      },
    });

    const fullText = result.fullTextAnnotation;

    if (!fullText || !fullText.text) {
      logger.warn("Google Vision: metin bulunamadı");
      return { text: "", confidence: 0, pageCount: 1, provider: "google-vision" };
    }

    // Sayfa bazlı güven skoru hesapla
    const pages = fullText.pages ?? [];
    let totalConfidence = 0;
    let blockCount = 0;

    for (const page of pages) {
      for (const block of page.blocks ?? []) {
        const conf = block.confidence ?? 0;
        totalConfidence += conf;
        blockCount++;
      }
    }

    const avgConfidence = blockCount > 0 ? totalConfidence / blockCount : 0;

    logger.debug(
      { textLength: fullText.text.length, confidence: avgConfidence.toFixed(2) },
      "Google Vision OCR tamamlandı"
    );

    return {
      text: fullText.text,
      confidence: avgConfidence,
      pageCount: pages.length || 1,
      provider: "google-vision",
    };
  } catch (err) {
    logger.error({ err }, "Google Vision OCR hatası");
    throw err;
  }
}

/**
 * Vision API'nin kullanılabilir olup olmadığını kontrol et
 */
export function isGoogleVisionAvailable(): boolean {
  return !!(
    process.env["GOOGLE_APPLICATION_CREDENTIALS"] &&
    process.env["GOOGLE_CLOUD_PROJECT_ID"]
  );
}
