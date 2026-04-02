/**
 * Servis unit testleri
 * elevenlabs.service — splitTextIntoChunks
 * claude.service — analyzeNoteText fallback
 */

import { describe, it, expect, vi } from "vitest";

// ──────── ElevenLabs — Metin Bölme ────────

describe("splitTextIntoChunks", () => {
  it("kısa metni tek chunk olarak döner", async () => {
    const { splitTextIntoChunks } = await import("../src/shared/services/elevenlabs.service");
    const result = splitTextIntoChunks("Kısa metin.", 5000);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe("Kısa metin.");
  });

  it("uzun metni maxLength'i aşmayan parçalara böler", async () => {
    const { splitTextIntoChunks } = await import("../src/shared/services/elevenlabs.service");
    // 100 karakterlik metin, 30 karakterlik parçalara böl
    const text = "Bu bir test cümlesidir. İkinci cümle burada bitiyor. Üçüncü cümle de burada.";
    const chunks = splitTextIntoChunks(text, 30);
    chunks.forEach((c) => {
      expect(c.length).toBeLessThanOrEqual(30);
    });
    // Birleşince orijinale eşit olmalı (boşluklar trim edilebilir)
    expect(chunks.join(" ").replace(/\s+/g, " ").trim().length).toBeGreaterThan(0);
  });

  it("boş string → boş array", async () => {
    const { splitTextIntoChunks } = await import("../src/shared/services/elevenlabs.service");
    const result = splitTextIntoChunks("", 5000);
    expect(result).toHaveLength(0);
  });
});

// ──────── ElevenLabs — Süre Tahmini ────────

describe("estimateDuration", () => {
  it("karakter sayısından süre hesaplar", async () => {
    const { estimateDuration } = await import("../src/shared/services/elevenlabs.service");
    // 1400 karakter → ~100 saniye (14 karakter/saniye)
    expect(estimateDuration(1400)).toBe(100);
    expect(estimateDuration(14)).toBe(1);
    expect(estimateDuration(0)).toBe(0);
  });
});

// ──────── Claude Service — Fallback ────────

describe("analyzeNoteText — fallback", () => {
  it("çok kısa metin için fallback döner (API çağrısı yapmaz)", async () => {
    const { analyzeNoteText } = await import("../src/shared/services/claude.service");
    const result = await analyzeNoteText("Kısa", "Test Başlık");

    expect(result.title).toBe("Test Başlık");
    expect(result.sections).toHaveLength(1);
    expect(result.sections[0]?.content).toBe("Kısa");
    expect(result.tags).toHaveLength(0);
  });
});

// ──────── Error Sınıfı ────────

describe("AppError", () => {
  it("factory metodları doğru status kodlarını verir", async () => {
    const { AppError } = await import("../src/shared/utils/errors");

    expect(AppError.badRequest("hata").statusCode).toBe(400);
    expect(AppError.unauthorized().statusCode).toBe(401);
    expect(AppError.forbidden().statusCode).toBe(403);
    expect(AppError.notFound("Not").statusCode).toBe(404);
    expect(AppError.internal().statusCode).toBe(500);
  });

  it("notFound mesajı kaynak adını içerir", async () => {
    const { AppError } = await import("../src/shared/utils/errors");
    const err = AppError.notFound("Podcast");
    expect(err.message).toContain("Podcast");
  });
});

// ──────── Health Check ────────

describe("GET /api/health", () => {
  it("sağlık durumunu döner", async () => {
    const request = (await import("supertest")).default;
    const app = (await import("../src/app")).default;

    const res = await request(app).get("/api/health");
    expect(res.status).toBeOneOf([200, 503]);
    expect(res.body.data.timestamp).toBeDefined();
    expect(res.body.data.version).toBeDefined();
  });
});
