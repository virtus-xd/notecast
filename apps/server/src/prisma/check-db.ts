/**
 * Veritabanı bağlantı testi
 * Çalıştırma: tsx src/prisma/check-db.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log("🔍 Veritabanı bağlantısı test ediliyor...");

  try {
    await prisma.$queryRaw`SELECT version()`;
    console.log("✅ PostgreSQL bağlantısı başarılı!\n");

    // Tablo sayılarını göster
    const userCount = await prisma.user.count();
    const voiceCount = await prisma.voice.count();
    const configCount = await prisma.systemConfig.count();
    const noteCount = await prisma.note.count();
    const podcastCount = await prisma.podcast.count();

    console.log("📊 Tablo durumu:");
    console.log(`  👤 User:         ${userCount}`);
    console.log(`  🎙️  Voice:        ${voiceCount}`);
    console.log(`  ⚙️  SystemConfig: ${configCount}`);
    console.log(`  📝 Note:         ${noteCount}`);
    console.log(`  🎵 Podcast:      ${podcastCount}`);
    console.log();

    if (voiceCount > 0) {
      const voices = await prisma.voice.findMany({ orderBy: { sortOrder: "asc" } });
      console.log("🎙️  Sesler:");
      for (const v of voices) {
        console.log(`  - ${v.name} (${v.gender}, ${v.category})`);
      }
      console.log();
    }
  } catch (err) {
    console.error("❌ Veritabanı bağlantı hatası:", err);
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => void prisma.$disconnect());
