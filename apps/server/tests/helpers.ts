/**
 * Test yardımcıları
 * Ortak factory fonksiyonları ve mock veri üreticileri
 */

import jwt from "jsonwebtoken";
import type { User, Note, Podcast } from "@prisma/client";

const JWT_SECRET = process.env["JWT_SECRET"] ?? "test-jwt-secret-minimum-32-chars-long!!";

// ──────── Factory Fonksiyonları ────────

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-test-id",
    email: "test@example.com",
    passwordHash: "$2b$12$hashedpassword",
    name: "Test User",
    avatarUrl: null,
    role: "FREE",
    emailVerified: true,
    verifyToken: null,
    resetToken: null,
    resetTokenExp: null,
    preferredVoiceId: null,
    monthlyCredits: 3,
    creditsUsed: 0,
    creditsResetAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: "note-test-id",
    userId: "user-test-id",
    title: "Test Notu",
    description: null,
    uploadType: "TEXT",
    originalFileUrl: "notes/user-test-id/text/test.txt",
    originalFileName: "test.txt",
    fileSizeBytes: 512,
    mimeType: "text/plain",
    status: "READY",
    rawExtractedText: "Ham metin içeriği",
    processedText: "İşlenmiş metin içeriği",
    sections: [{ title: "Bölüm 1", content: "İçerik", order: 1 }],
    tags: ["matematik", "türev"],
    subject: "Matematik",
    errorMessage: null,
    processingStartedAt: new Date(),
    processingCompletedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function makePodcast(overrides: Partial<Podcast> = {}): Podcast {
  return {
    id: "podcast-test-id",
    userId: "user-test-id",
    noteId: "note-test-id",
    title: "Test Podcast",
    description: null,
    voiceId: "voice-test-id",
    voiceName: "Ahmet",
    status: "READY",
    scriptText: "Merhaba! Bugün matematik hakkında konuşacağız...",
    audioUrl: "podcasts/user-test-id/podcast-test-id.mp3",
    audioDuration: 120,
    audioSizeBytes: 1_500_000,
    speed: 1.0,
    style: "educational",
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ──────── Token Üreticisi ────────

/**
 * Test için geçerli JWT access token üretir
 */
export function makeAccessToken(userId = "user-test-id", role = "FREE"): string {
  return jwt.sign(
    { sub: userId, email: "test@example.com", role },
    JWT_SECRET,
    { expiresIn: "15m" }
  );
}

/**
 * Authorization header değeri döner
 */
export function authHeader(userId = "user-test-id"): { Authorization: string } {
  return { Authorization: `Bearer ${makeAccessToken(userId)}` };
}
