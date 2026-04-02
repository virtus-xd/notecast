/**
 * Tesseract.js OCR servisi
 * Google Vision yetersiz veya kullanılamaz ise fallback
 */

import Tesseract from "tesseract.js";
import { logger } from "../utils/logger";
import type { OcrResult } from "./google-vision.service";

// ──────── Worker yönetimi ────────

// Singleton worker — tekrar tekrar oluşturmaktan kaçın
let _worker: Tesseract.Worker | null = null;
let _workerReady = false;

async function getWorker(): Promise<Tesseract.Worker> {
  if (_worker && _workerReady) return _worker;

  logger.debug("Tesseract worker başlatılıyor...");

  _worker = await Tesseract.createWorker(["tur", "eng"], 1, {
    logger: (m: { status: string; progress?: number }) => {
      if (m.status === "recognizing text") {
        // Gereksiz log kirliliği önle
      }
    },
  });

  _workerReady = true;
  logger.debug("Tesseract worker hazır (tur+eng)");
  return _worker;
}

// ──────── OCR ────────

/**
 * Görsel buffer'ından metin çıkar (Tesseract)
 */
export async function extractTextWithTesseract(
  imageBuffer: Buffer
): Promise<OcrResult> {
  try {
    const worker = await getWorker();

    const { data } = await worker.recognize(imageBuffer);

    logger.debug(
      { textLength: data.text.length, confidence: data.confidence },
      "Tesseract OCR tamamlandı"
    );

    return {
      text: data.text.trim(),
      confidence: (data.confidence ?? 0) / 100, // Tesseract 0–100 döndürür
      pageCount: 1,
      provider: "google-vision", // Tip uyumu için — gerçekte tesseract
    };
  } catch (err) {
    logger.error({ err }, "Tesseract OCR hatası");
    return { text: "", confidence: 0, pageCount: 1, provider: "google-vision" };
  }
}

/**
 * Worker'ı kapat (graceful shutdown)
 */
export async function terminateTesseract(): Promise<void> {
  if (_worker) {
    await _worker.terminate();
    _worker = null;
    _workerReady = false;
    logger.debug("Tesseract worker kapatıldı");
  }
}
