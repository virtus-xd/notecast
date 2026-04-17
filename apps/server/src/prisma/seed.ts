/**
 * NotCast Veritabanı Seed
 * Varsayılan sesler, test kullanıcısı ve sistem konfigürasyonu
 *
 * Çalıştırma: pnpm db:seed
 */

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// ──────── Sabitler ────────
const BCRYPT_SALT_ROUNDS = 12;

// ──────── Varsayılan Türkçe Sesler ────────
const DEFAULT_VOICES = [
  // ──── Google Cloud TTS — WaveNet Türkçe Sesler ────
  {
    elevenLabsId: "tr-TR-Wavenet-A",
    name: "Aylin (Google WaveNet)",
    description: "Google WaveNet kadın sesi — doğal ve akıcı Türkçe.",
    gender: "female",
    accent: "turkish",
    category: "academic",
    isActive: true,
    sortOrder: 1,
  },
  {
    elevenLabsId: "tr-TR-Wavenet-B",
    name: "Burak (Google WaveNet)",
    description: "Google WaveNet erkek sesi — doğal ve güvenilir.",
    gender: "male",
    accent: "turkish",
    category: "academic",
    isActive: true,
    sortOrder: 2,
  },
  {
    elevenLabsId: "tr-TR-Wavenet-C",
    name: "Ceren (Google WaveNet)",
    description: "Google WaveNet kadın sesi — yumuşak ve sıcak ton.",
    gender: "female",
    accent: "turkish",
    category: "conversational",
    isActive: true,
    sortOrder: 3,
  },
  {
    elevenLabsId: "tr-TR-Wavenet-E",
    name: "Emre (Google WaveNet)",
    description: "Google WaveNet erkek sesi — alternatif erkek tonu.",
    gender: "male",
    accent: "turkish",
    category: "storytelling",
    isActive: true,
    sortOrder: 4,
  },
  // ──── Google Cloud TTS — Chirp 3 HD (API key varsa dinamik eklenir) ────
  // Not: Chirp 3 sesleri server startup'ta seed-google-voices.ts tarafından
  // Google TTS API'den dinamik olarak çekilip eklenir.
] as const;

// ──────── Sistem Konfigürasyonu ────────
const SYSTEM_CONFIGS = [
  {
    key: "free_monthly_podcast_limit",
    value: "3",
  },
  {
    key: "max_image_size_mb",
    value: "10",
  },
  {
    key: "max_pdf_size_mb",
    value: "20",
  },
  {
    key: "max_text_size_mb",
    value: "1",
  },
  {
    key: "elevenlabs_model",
    value: "eleven_multilingual_v2",
  },
  {
    key: "anthropic_model",
    value: "claude-sonnet-4-20250514",
  },
  {
    key: "maintenance_mode",
    value: "false",
  },
] as const;

async function seedVoices(): Promise<void> {
  console.log("🎙️  Sesler ekleniyor...");

  for (const voice of DEFAULT_VOICES) {
    // Google TTS sesleri tr-TR ile başlar
    const provider = voice.elevenLabsId.startsWith("tr-TR-") ? "google" : "elevenlabs";

    await prisma.voice.upsert({
      where: { elevenLabsId: voice.elevenLabsId },
      update: {
        name: voice.name,
        description: voice.description,
        gender: voice.gender,
        accent: voice.accent,
        category: voice.category,
        isActive: voice.isActive,
        sortOrder: voice.sortOrder,
        provider,
      },
      create: { ...voice, provider },
    });
    console.log(`  ✓ ${voice.name} (${voice.gender}, ${provider})`);
  }
}

async function seedSystemConfig(): Promise<void> {
  console.log("⚙️  Sistem konfigürasyonu ekleniyor...");

  for (const config of SYSTEM_CONFIGS) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
    console.log(`  ✓ ${config.key} = ${config.value}`);
  }
}

async function seedTestUsers(): Promise<void> {
  // Sadece geliştirme ortamında test kullanıcıları oluştur
  if (process.env["NODE_ENV"] === "production") {
    console.log("⏭️  Production: Test kullanıcıları atlanıyor");
    return;
  }

  console.log("👤  Test kullanıcıları ekleniyor...");

  const testPasswordHash = await bcrypt.hash("Test1234!", BCRYPT_SALT_ROUNDS);
  const adminPasswordHash = await bcrypt.hash("Admin1234!", BCRYPT_SALT_ROUNDS);

  // Free tier test kullanıcısı
  const testUser = await prisma.user.upsert({
    where: { email: "test@notcast.dev" },
    update: {},
    create: {
      email: "test@notcast.dev",
      passwordHash: testPasswordHash,
      name: "Test Kullanıcı",
      role: UserRole.FREE,
      emailVerified: true,
      monthlyCredits: 3,
    },
  });
  console.log(`  ✓ ${testUser.email} (FREE)`);

  // Premium test kullanıcısı
  const premiumUser = await prisma.user.upsert({
    where: { email: "premium@notcast.dev" },
    update: {},
    create: {
      email: "premium@notcast.dev",
      passwordHash: testPasswordHash,
      name: "Premium Kullanıcı",
      role: UserRole.PREMIUM,
      emailVerified: true,
      monthlyCredits: 999,
    },
  });
  console.log(`  ✓ ${premiumUser.email} (PREMIUM)`);

  // Admin kullanıcısı
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@notcast.dev" },
    update: {},
    create: {
      email: "admin@notcast.dev",
      passwordHash: adminPasswordHash,
      name: "Admin",
      role: UserRole.ADMIN,
      emailVerified: true,
      monthlyCredits: 999,
    },
  });
  console.log(`  ✓ ${adminUser.email} (ADMIN)`);
}

async function main(): Promise<void> {
  console.log("\n🌱 NotCast Seed başlatılıyor...\n");

  await seedVoices();
  await seedSystemConfig();
  await seedTestUsers();

  console.log("\n✅ Seed tamamlandı!\n");

  if (process.env["NODE_ENV"] !== "production") {
    console.log("Test hesapları:");
    console.log("  📧 test@notcast.dev     🔑 Test1234!   (FREE)");
    console.log("  📧 premium@notcast.dev  🔑 Test1234!   (PREMIUM)");
    console.log("  📧 admin@notcast.dev    🔑 Admin1234!  (ADMIN)");
    console.log();
  }
}

main()
  .catch((err) => {
    console.error("❌ Seed hatası:", err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
