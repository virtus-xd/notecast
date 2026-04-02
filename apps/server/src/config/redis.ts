/**
 * Redis bağlantı konfigürasyonu
 * Bull queue ve token blacklist için kullanılır
 */

import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../shared/utils/logger";

const isTLS = env.REDIS_URL.startsWith("rediss://");

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
  ...(isTLS && { tls: { rejectUnauthorized: false } }),
});

redis.on("connect", () => {
  logger.info("Redis bağlantısı kuruldu");
});

redis.on("error", (err) => {
  logger.error({ err }, "Redis bağlantı hatası");
});

redis.on("close", () => {
  logger.warn("Redis bağlantısı kapandı");
});

/**
 * Redis bağlantısını kapat (graceful shutdown için)
 */
export async function disconnectRedis(): Promise<void> {
  await redis.quit();
}
