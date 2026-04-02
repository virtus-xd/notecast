/**
 * Text Analyzer Processor
 * Ham OCR metnini Claude API ile analiz eder, yapılandırılmış içerik üretir.
 */

import { analyzeNoteText, type AnalyzedNoteContent } from "../../../shared/services/claude.service";
import { logger } from "../../../shared/utils/logger";

export type { AnalyzedNoteContent };

/**
 * Ham OCR metnini analiz eder.
 * Claude API başarısız olursa fallback değerlerle devam eder (hata fırlatmaz).
 */
export async function analyzeText(
  rawText: string,
  noteTitle?: string
): Promise<AnalyzedNoteContent> {
  if (!rawText || rawText.trim().length === 0) {
    logger.warn("analyzeText: boş metin — fallback döndürülüyor");
    return {
      title: noteTitle ?? "Başlıksız Not",
      subject: null,
      summary: null,
      sections: [{ title: "", content: rawText ?? "", order: 1 }],
      tags: [],
    };
  }

  logger.info(
    { textLength: rawText.length, noteTitle },
    "Metin analizi başlatıldı"
  );

  const result = await analyzeNoteText(rawText, noteTitle);

  logger.info(
    {
      title: result.title,
      subject: result.subject,
      sectionCount: result.sections.length,
      tagCount: result.tags.length,
    },
    "Metin analizi tamamlandı"
  );

  return result;
}
