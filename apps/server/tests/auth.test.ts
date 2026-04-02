/**
 * Auth endpoint testleri
 * POST /api/auth/register
 * POST /api/auth/login
 * GET  /api/auth/me
 * POST /api/auth/logout
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import app from "../src/app";
import { makeUser, makeAccessToken } from "./helpers";

// ──────── Prisma Mock Referansları ────────

const { prisma } = await import("../src/config/database");
const { redis } = await import("../src/config/redis");

// ──────── Kayıt Testleri ────────

describe("POST /api/auth/register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("geçerli veri ile kullanıcı oluşturur → 201", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null); // e-posta yok
    vi.mocked(prisma.user.create).mockResolvedValue(makeUser());

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "yeni@test.com", password: "Test1234!", name: "Yeni Kullanıcı" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe("test@example.com");
  });

  it("var olan e-posta ile kayıt → 422", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "Test1234!", name: "Kullanıcı" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it("zayıf şifre ile kayıt → 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@test.com", password: "123", name: "Kullanıcı" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("eksik alan ile kayıt → 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "new@test.com" });

    expect(res.status).toBe(400);
  });
});

// ──────── Giriş Testleri ────────

describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("doğru kimlik bilgileriyle giriş → 200 + token", async () => {
    const hash = await bcrypt.hash("Test1234!", 12);
    const user = makeUser({ passwordHash: hash });

    vi.mocked(prisma.user.findFirst).mockResolvedValue(user);
    vi.mocked(prisma.session.create).mockResolvedValue({
      id: "session-id",
      userId: user.id,
      token: "refresh-token",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "Test1234!" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user).toBeDefined();
    // Refresh token HttpOnly cookie olarak gelir
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("yanlış şifre ile giriş → 401", async () => {
    const hash = await bcrypt.hash("DogruSifre1!", 12);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser({ passwordHash: hash }));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "YanlisSifre1!" });

    expect(res.status).toBe(401);
  });

  it("var olmayan kullanıcı ile giriş → 401", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "yok@test.com", password: "Test1234!" });

    expect(res.status).toBe(401);
  });

  it("geçersiz e-posta formatı → 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "geçersiz-email", password: "Test1234!" });

    expect(res.status).toBe(400);
  });
});

// ──────── Mevcut Kullanıcı Testleri ────────

describe("GET /api/auth/me", () => {
  beforeEach(() => vi.clearAllMocks());

  it("geçerli token ile kullanıcı bilgisi döner → 200", async () => {
    const user = makeUser();
    vi.mocked(prisma.user.findFirst).mockResolvedValue(user);
    vi.mocked(redis.get).mockResolvedValue(null); // token blacklist'te değil

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${makeAccessToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBe(user.id);
    // Şifre hash dönmemeli
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("token olmadan → 401", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("geçersiz token → 401", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer gecersiz.token.burada");
    expect(res.status).toBe(401);
  });
});

// ──────── Çıkış Testleri ────────

describe("POST /api/auth/logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("token ile çıkış → 204", async () => {
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(makeUser());
    vi.mocked(prisma.session.delete).mockResolvedValue({} as never);

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${makeAccessToken()}`);

    expect(res.status).toBe(204);
  });
});
