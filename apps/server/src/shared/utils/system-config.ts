/**
 * Sistem konfigürasyonu yardımcısı
 * Veritabanındaki SystemConfig tablosuna erişim
 */

import { prisma } from "../../config/database";
import { logger } from "./logger";

// Bellek önbelleği (TTL: 5 dakika)
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000;
const configCache = new Map<string, { value: string; expiresAt: number }>();

/**
 * Sistem konfigürasyon değeri al (önbellekli)
 */
export async function getSystemConfig(key: string): Promise<string | null> {
  const cached = configCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const config = await prisma.systemConfig.findUnique({ where: { key } });
    if (config) {
      configCache.set(key, {
        value: config.value,
        expiresAt: Date.now() + CONFIG_CACHE_TTL_MS,
      });
      return config.value;
    }
  } catch (err) {
    logger.error({ err, key }, "SystemConfig okuma hatası");
  }

  return null;
}

/**
 * Sistem konfigürasyon değeri güncelle
 */
export async function setSystemConfig(key: string, value: string): Promise<void> {
  await prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  // Önbelleği temizle
  configCache.delete(key);
}

/**
 * Bakım modu aktif mi?
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const value = await getSystemConfig("maintenance_mode");
  return value === "true";
}
