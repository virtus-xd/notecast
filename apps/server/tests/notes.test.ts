/**
 * Notes endpoint testleri
 * GET  /api/notes
 * GET  /api/notes/:id
 * POST /api/notes/upload (metin)
 * DELETE /api/notes/:id
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { makeUser, makeNote, makeAccessToken } from "./helpers";

const { prisma } = await import("../src/config/database");
const { redis } = await import("../src/config/redis");

function authHeader() {
  return { Authorization: `Bearer ${makeAccessToken()}` };
}

// ──────── Not Listesi ────────

describe("GET /api/notes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("auth gerektirir → 401", async () => {
    const res = await request(app).get("/api/notes");
    expect(res.status).toBe(401);
  });

  it("kullanıcının notlarını listeler → 200", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());

    const notes = [makeNote(), makeNote({ id: "note-2", title: "İkinci Not" })];
    vi.mocked(prisma.note.findMany).mockResolvedValue(notes);
    vi.mocked(prisma.note.count).mockResolvedValue(2);
    vi.mocked(prisma.$transaction).mockResolvedValue([notes, 2]);

    const res = await request(app)
      .get("/api/notes")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.total).toBe(2);
  });

  it("sayfalama parametreleri ile çalışır", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.$transaction).mockResolvedValue([[], 0]);

    const res = await request(app)
      .get("/api/notes?page=2&limit=10")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(2);
  });
});

// ──────── Not Detayı ────────

describe("GET /api/notes/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("var olan notu döner → 200", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.note.findFirst).mockResolvedValue(makeNote());

    const res = await request(app)
      .get("/api/notes/note-test-id")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("note-test-id");
    expect(res.body.data.title).toBe("Test Notu");
  });

  it("var olmayan not → 404", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.note.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .get("/api/notes/olmayan-id")
      .set(authHeader());

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it("başka kullanıcının notu → 404", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    // JWT'deki userId ile notun userId'si farklı — findFirst userId filtresi ile null döner
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.note.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .get("/api/notes/baska-kullanicinin-notu")
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});

// ──────── Not Yükleme (Metin) ────────

describe("POST /api/notes/upload (text)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("metin yükleme → 201 + not kaydı", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.note.create).mockResolvedValue(
      makeNote({ status: "UPLOADED" })
    );

    const res = await request(app)
      .post("/api/notes/upload")
      .set(authHeader())
      .field("text", "Bu bir test metnidir. Notcast için örnek içerik.")
      .field("title", "Test Metni");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.note).toBeDefined();
    expect(res.body.data.note.id).toBe("note-test-id");
  });

  it("dosya ve metin olmadan yükleme → 400", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());

    const res = await request(app)
      .post("/api/notes/upload")
      .set(authHeader());

    expect(res.status).toBe(400);
  });

  it("auth olmadan yükleme → 401", async () => {
    const res = await request(app)
      .post("/api/notes/upload")
      .field("text", "Test metni");

    expect(res.status).toBe(401);
  });
});

// ──────── Not Güncelleme ────────

describe("PATCH /api/notes/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("not başlığını günceller → 200", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.note.findFirst).mockResolvedValue(makeNote());
    vi.mocked(prisma.note.update).mockResolvedValue(
      makeNote({ title: "Güncellenmiş Başlık" })
    );

    const res = await request(app)
      .patch("/api/notes/note-test-id")
      .set(authHeader())
      .send({ title: "Güncellenmiş Başlık" });

    expect(res.status).toBe(200);
    expect(res.body.data.note.title).toBe("Güncellenmiş Başlık");
  });
});

// ──────── Not Silme ────────

describe("DELETE /api/notes/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("notu siler → 204", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.note.findFirst).mockResolvedValue(makeNote());
    vi.mocked(prisma.note.delete).mockResolvedValue(makeNote());

    const res = await request(app)
      .delete("/api/notes/note-test-id")
      .set(authHeader());

    expect(res.status).toBe(204);
  });

  it("var olmayan notu silmeye çalış → 404", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.note.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/notes/olmayan-id")
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});
