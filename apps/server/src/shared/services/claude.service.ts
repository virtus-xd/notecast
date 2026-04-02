/**
 * Claude API Service
 * Anthropic SDK wrapper — metin analizi ve podcast script üretimi
 */

import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";
import { logger } from "../utils/logger";

// ──────── Sabitler ────────

const MAX_RETRY_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 90_000;

// ──────── İstemci ────────

const client = new Anthropic({
  apiKey: env.ANTHROPIC_API_KEY,
  timeout: REQUEST_TIMEOUT_MS,
  maxRetries: 0, // Manuel retry yapıyoruz
});

// ──────── Retry Yardımcısı ────────

/**
 * Exponential backoff ile çağrıyı yeniden dener.
 * 429 (rate limit) ve 5xx hataları için retry yapar, 4xx için yapmaz.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  attempt = 1
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const isRetryable =
      err instanceof Anthropic.RateLimitError ||
      err instanceof Anthropic.InternalServerError ||
      err instanceof Anthropic.APIConnectionError ||
      err instanceof Anthropic.APIConnectionTimeoutError;

    if (!isRetryable || attempt >= MAX_RETRY_ATTEMPTS) {
      throw err;
    }

    const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
    logger.warn(
      { attempt, delay, errType: (err as Error).constructor.name },
      "Claude API isteği başarısız — yeniden deneniyor"
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
    return withRetry(fn, attempt + 1);
  }
}

// ──────── Yapılandırılmış İçerik Tipi ────────

export interface AnalyzedNoteContent {
  title: string;
  subject: string | null;
  sections: Array<{ title: string; content: string; order: number }>;
  tags: string[];
  summary: string | null;
}

// ──────── Metin Analizi ────────

const TEXT_ANALYSIS_SYSTEM_PROMPT = `Sen bir akademik metin düzenleme uzmanısın. Sana bir öğrencinin ders notlarından çıkarılmış ham OCR metni verilecek.

Görevin:
1. OCR hatalarını düzelt (yanlış karakter tanıma, eksik harfler, bozuk Türkçe karakterler vs.)
2. Metni anlamlı başlıklar altında düzenle
3. Zaten başlıklara ayrılmışsa, mevcut yapıyı koru ve iyileştir
4. Kısaltmaları açıkla (gerekirse parantez içinde, orijinali değiştirme)
5. Madde işaretlerini ve numaralı listeleri düzenle
6. Yazım ve dilbilgisi hatalarını düzelt

KURAL: İçerikten bilgi çıkarma veya ekleme yapma. Sadece düzenle ve yapılandır.

Yanıtını YALNIZCA geçerli JSON formatında ver (başka hiçbir metin olmadan):
{
  "title": "Otomatik tespit edilen konu başlığı (kısa, max 60 karakter)",
  "subject": "Ders adı (tespit edilebilirse, yoksa null)",
  "summary": "2-3 cümlelik özet (Türkçe, mevcut içerikten üret)",
  "sections": [
    { "title": "Bölüm Başlığı", "content": "Düzenlenmiş metin...", "order": 1 }
  ],
  "tags": ["etiket1", "etiket2", "etiket3"]
}

Etiketler için kısa, tek kelimelik veya iki kelimelik Türkçe terimler kullan (max 5 etiket).
Sections dizisi boş olmamalı — en az bir bölüm oluştur.`;

/**
 * Ham OCR metnini Claude ile analiz eder, yapılandırılmış içerik döner.
 * Hata durumunda fallback olarak basit yapılandırma uygulanır.
 */
export async function analyzeNoteText(
  rawText: string,
  noteTitle?: string
): Promise<AnalyzedNoteContent> {
  // Çok kısa metin için Claude'a göndermeye gerek yok
  if (rawText.trim().length < 20) {
    return buildFallback(rawText, noteTitle);
  }

  // Çok uzun metni kırp (token limiti)
  const truncatedText = rawText.length > 20_000
    ? rawText.slice(0, 20_000) + "\n\n[Metin token limiti nedeniyle kesildi]"
    : rawText;

  const userMessage = noteTitle
    ? `Not başlığı: ${noteTitle}\n\nHam metin:\n${truncatedText}`
    : `Ham metin:\n${truncatedText}`;

  try {
    const response = await withRetry(() =>
      client.messages.create({
        model: env.ANTHROPIC_MODEL,
        max_tokens: env.ANTHROPIC_MAX_TOKENS,
        system: TEXT_ANALYSIS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      })
    );

    const rawContent = response.content[0];
    if (rawContent.type !== "text") {
      throw new Error("Beklenmeyen Claude yanıt tipi");
    }

    const parsed = parseClaudeJson<AnalyzedNoteContent>(rawContent.text);
    return validateAnalyzedContent(parsed, rawText, noteTitle);
  } catch (err) {
    logger.error({ err }, "Claude metin analizi başarısız — fallback kullanılıyor");
    return buildFallback(rawText, noteTitle);
  }
}

// ──────── Podcast Script Oluşturma ────────

export type PodcastStyle = "educational" | "conversational" | "summary";

const STYLE_INSTRUCTIONS: Record<PodcastStyle, string> = {
  educational:
    'Ders anlatır gibi, örneklerle zenginleştir. "Şimdi şuna bakalım...", "Önemli nokta şu ki..." gibi geçiş cümleleri kullan. Açıklayıcı ve öğretici bir ton kullan.',
  conversational:
    'Arkadaşıyla konuşur gibi, samimi bir dil kullan. "Biliyor musun...", "Düşün bir..." gibi ifadeler kullan. Doğal ve rahat bir ton.',
  summary:
    'Kısa ve öz tut. "Özetle...", "Dikkat edilmesi gereken...", "Temel nokta şu:" gibi ifadeler kullan. Gereksiz ayrıntıları atla.',
};

const PODCAST_SCRIPT_SYSTEM_PROMPT = `Sen deneyimli bir Türkçe podcast sunucususun. Sana bir öğrencinin ders notları verilecek. Bu notları dinleyiciye anlatır gibi bir podcast script'ine dönüştür.

Kurallar:
1. Doğal konuşma dili kullan, yazı dili değil
2. Giriş bölümü ekle: "Merhaba! Bugün [konu] hakkında konuşacağız..."
3. Bölümler arası geçiş cümleleri ekle
4. Kapanış bölümü ekle: "Bu bölümde [özet]... Tekrar görüşmek üzere!"
5. Anlaşılması zor kavramları basit örneklerle açıkla
6. Uzun cümleleri kısa, konuşmaya uygun cümlelere dönüştür
7. SSML etiketleri KULLANMA, düz metin olarak yaz
8. Noktalama işaretlerini doğal duraklamalar için kullan
9. Yanıtı YALNIZCA script metni olarak ver, başka açıklama ekleme`;

/**
 * Düzenlenmiş not içeriğinden podcast script'i üretir.
 */
export async function generatePodcastScript(
  content: string,
  style: PodcastStyle,
  subject?: string | null
): Promise<string> {
  const styleInstruction = STYLE_INSTRUCTIONS[style];
  const subjectLine = subject ? `Ders/Konu: ${subject}\n` : "";

  const userMessage =
    `${subjectLine}Stil: ${style}\nStil açıklaması: ${styleInstruction}\n\nNot içeriği:\n${content}`;

  const response = await withRetry(() =>
    client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: env.ANTHROPIC_MAX_TOKENS,
      system: PODCAST_SCRIPT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    })
  );

  const rawContent = response.content[0];
  if (rawContent.type !== "text") {
    throw new Error("Beklenmeyen Claude yanıt tipi");
  }

  return rawContent.text.trim();
}

// ──────── Yardımcı Fonksiyonlar ────────

/**
 * Claude'un JSON çıktısını parse eder.
 * Bazen markdown code block içine alabilir — temizler.
 */
function parseClaudeJson<T>(text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .trim();

  return JSON.parse(cleaned) as T;
}

/**
 * Claude'un döndürdüğü içeriği doğrular ve eksik alanları tamamlar.
 */
function validateAnalyzedContent(
  parsed: Partial<AnalyzedNoteContent>,
  rawText: string,
  noteTitle?: string
): AnalyzedNoteContent {
  const sections = Array.isArray(parsed.sections) && parsed.sections.length > 0
    ? parsed.sections.map((s, i) => ({
        title: String(s.title ?? ""),
        content: String(s.content ?? ""),
        order: typeof s.order === "number" ? s.order : i + 1,
      }))
    : [{ title: "", content: rawText, order: 1 }];

  return {
    title: String(parsed.title || noteTitle || "Başlıksız Not"),
    subject: parsed.subject ? String(parsed.subject) : null,
    summary: parsed.summary ? String(parsed.summary) : null,
    sections,
    tags: Array.isArray(parsed.tags)
      ? parsed.tags.slice(0, 5).map((t) => String(t))
      : [],
  };
}

/**
 * Claude API kullanılamadığında basit yapılandırma üretir.
 */
function buildFallback(
  rawText: string,
  noteTitle?: string
): AnalyzedNoteContent {
  return {
    title: noteTitle ?? "Başlıksız Not",
    subject: null,
    summary: null,
    sections: [{ title: "", content: rawText, order: 1 }],
    tags: [],
  };
}
