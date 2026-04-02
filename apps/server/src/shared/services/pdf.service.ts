/**
 * PDF işleme servisi
 * Metin içerikli PDF'den direkt metin çıkarma
 * Taranmış PDF → görsel dönüşüm için placeholder (PART 5+)
 */

import pdfParse from "pdf-parse";
import { logger } from "../utils/logger";

// ──────── Tipler ────────

export interface PdfExtractResult {
  text: string;
  pageCount: number;
  isTextBased: boolean; // false → taranmış, OCR gerekli
}

// Metin tabanlı PDF tespiti için minimum karakter / sayfa
const MIN_CHARS_PER_PAGE = 50;

// ──────── PDF Metin Çıkarma ────────

/**
 * PDF buffer'ından metin çıkar
 * Taranmış (görsel tabanlı) PDF'leri tespit eder
 */
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<PdfExtractResult> {
  try {
    const data = await pdfParse(pdfBuffer, {
      // Özel render — ham metni al
      pagerender: (pageData: { getTextContent: () => Promise<{ items: { str: string }[] }> }) =>
        pageData.getTextContent().then((tc) => tc.items.map((i) => i.str).join(" ")),
    });

    const text = data.text.trim();
    const pageCount = data.numpages;

    // Metin yoğunluğunu kontrol et — taranmış mı?
    const avgCharsPerPage = pageCount > 0 ? text.length / pageCount : 0;
    const isTextBased = avgCharsPerPage >= MIN_CHARS_PER_PAGE;

    logger.debug(
      { pageCount, textLength: text.length, avgCharsPerPage: avgCharsPerPage.toFixed(0), isTextBased },
      "PDF metin çıkarma tamamlandı"
    );

    return { text, pageCount, isTextBased };
  } catch (err) {
    logger.error({ err }, "PDF metin çıkarma hatası");
    return { text: "", pageCount: 0, isTextBased: false };
  }
}

/**
 * PDF'i sayfa görsellerine dönüştür (taranmış PDF için)
 * Not: Gerçek implementasyon için `pdf-poppler` veya `pdfjs-dist` gerekli.
 * Şu an ilk sayfayı placeholder olarak döndürür.
 */
export async function convertPdfPageToImage(
  _pdfBuffer: Buffer,
  _pageIndex = 0
): Promise<Buffer | null> {
  // TODO: pdf-poppler veya canvas tabanlı render
  logger.warn("PDF → görsel dönüşümü henüz implement edilmedi");
  return null;
}
