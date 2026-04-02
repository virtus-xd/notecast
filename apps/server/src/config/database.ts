/**
 * Prisma Client singleton instance
 * Bağlantı havuzu ve log yönetimi
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "../shared/utils/logger";

// Bağlantı havuzu boyutu — CPU çekirdek sayısına göre ayarlanır
const CONNECTION_POOL_SIZE = parseInt(process.env["DB_POOL_SIZE"] ?? "10", 10);

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "warn" },
    ],
    errorFormat: process.env["NODE_ENV"] === "production" ? "minimal" : "pretty",
    datasources: {
      db: {
        url: `${process.env["DATABASE_URL"]}?connection_limit=${CONNECTION_POOL_SIZE}&pool_timeout=20`,
      },
    },
  });
};

// Geliştirme ortamında hot-reload sırasında birden fazla instance oluşmasını önle
declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env["NODE_ENV"] !== "production") {
  globalThis.prismaGlobal = prisma;
}

// Yavaş sorgu uyarısı (>500ms)
const SLOW_QUERY_THRESHOLD_MS = 500;

if (process.env["NODE_ENV"] === "development") {
  prisma.$on("query", (e) => {
    const durationMs = e.duration;
    if (durationMs > SLOW_QUERY_THRESHOLD_MS) {
      logger.warn(
        { query: e.query, params: e.params, duration: `${durationMs}ms` },
        "Yavaş Prisma Sorgusu"
      );
    } else {
      logger.debug(
        { query: e.query, duration: `${durationMs}ms` },
        "Prisma Query"
      );
    }
  });
}

prisma.$on("error", (e) => {
  logger.error({ message: e.message, target: e.target }, "Prisma Error");
});

prisma.$on("warn", (e) => {
  logger.warn({ message: e.message, target: e.target }, "Prisma Warning");
});

/**
 * Veritabanı bağlantısını test eder
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Veritabanı bağlantısını kapat (graceful shutdown için)
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
