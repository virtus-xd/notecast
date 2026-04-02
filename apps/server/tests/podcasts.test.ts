/**
 * Podcasts endpoint testleri
 * GET  /api/podcasts
 * GET  /api/podcasts/:id
 * POST /api/podcasts/generate
 * DELETE /api/podcasts/:id
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";
import { makeUser, makeNote, makePodcast, makeAccessToken } from "./helpers";

const { prisma } = await import("../src/config/database");
const { redis } = await import("../src/config/redis");

function authHeader() {
  return { Authorization: `Bearer ${makeAccessToken()}` };
}

// ──────── Podcast Listesi ────────

describe("GET /api/podcasts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("auth gerektirir → 401", async () => {
    const res = await request(app).get("/api/podcasts");
    expect(res.status).toBe(401);
  });

  it("kullanıcının podcast'lerini listeler → 200", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());

    const podcasts = [
      { ...makePodcast(), note: { id: "note-test-id", title: "Not", subject: null } },
    ];
    vi.mocked(prisma.$transaction).mockResolvedValue([podcasts, 1]);

    const res = await request(app)
      .get("/api/podcasts")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ──────── Podcast Detayı ────────

describe("GET /api/podcasts/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("var olan podcast'i döner → 200", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());

    const podcastWithNote = {
      ...makePodcast(),
      note: { id: "note-test-id", title: "Test Notu", subject: "Matematik" },
    };
    vi.mocked(prisma.podcast.findFirst).mockResolvedValue(podcastWithNote as never);

    const res = await request(app)
      .get("/api/podcasts/podcast-test-id")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe("podcast-test-id");
  });

  it("var olmayan podcast → 404", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.podcast.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .get("/api/podcasts/olmayan-id")
      .set(authHeader());

    expect(res.status).toBe(404);
  });
});

// ──────── Podcast Oluşturma ────────

describe("POST /api/podcasts/generate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("geçerli veri ile podcast oluşturur → 201", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.note.findFirst).mockResolvedValue(makeNote({ status: "READY" }));
    vi.mocked(prisma.voice.findUnique).mockResolvedValue({
      id: "voice-test-id",
      elevenLabsId: "eleven-voice-id",
      name: "Ahmet",
      description: null,
      gender: "male",
      accent: "turkish",
      previewUrl: null,
      category: "general",
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.podcast.count).mockResolvedValue(0); // Bu ay 0 podcast
    vi.mocked(prisma.podcast.create).mockResolvedValue(makePodcast({ status: "PENDING" }));

    const res = await request(app)
      .post("/api/podcasts/generate")
      .set(authHeader())
      .send({
        noteId: "note-test-id",
        voiceId: "voice-test-id",
        style: "educational",
        speed: 1.0,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.podcast).toBeDefined();
  });

  it("READY olmayan not → 400", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.note.findFirst).mockResolvedValue(
      makeNote({ status: "ANALYZING" })
    );

    const res = await request(app)
      .post("/api/podcasts/generate")
      .set(authHeader())
      .send({
        noteId: "note-test-id",
        voiceId: "voice-test-id",
        style: "educational",
        speed: 1.0,
      });

    expect(res.status).toBe(400);
  });

  it("aylık limit dolunca → 403", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    const user = makeUser({ monthlyCredits: 3, creditsUsed: 3 });
    vi.mocked(prisma.user.findFirst).mockResolvedValue(user);
    vi.mocked(prisma.note.findFirst).mockResolvedValue(makeNote());
    vi.mocked(prisma.voice.findUnique).mockResolvedValue({
      id: "voice-test-id",
      elevenLabsId: "eleven-voice-id",
      name: "Ahmet",
      description: null,
      gender: "male",
      accent: "turkish",
      previewUrl: null,
      category: "general",
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.podcast.count).mockResolvedValue(3); // Limit dolu

    const res = await request(app)
      .post("/api/podcasts/generate")
      .set(authHeader())
      .send({
        noteId: "note-test-id",
        voiceId: "voice-test-id",
        style: "educational",
        speed: 1.0,
      });

    expect(res.status).toBe(403);
  });

  it("eksik alan → 400", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());

    const res = await request(app)
      .post("/api/podcasts/generate")
      .set(authHeader())
      .send({ noteId: "note-test-id" }); // voiceId eksik

    expect(res.status).toBe(400);
  });
});

// ──────── Podcast Silme ────────

describe("DELETE /api/podcasts/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("podcast'i siler → 204", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.podcast.findFirst).mockResolvedValue(makePodcast());
    vi.mocked(prisma.podcast.delete).mockResolvedValue(makePodcast());

    const res = await request(app)
      .delete("/api/podcasts/podcast-test-id")
      .set(authHeader());

    expect(res.status).toBe(204);
  });
});
