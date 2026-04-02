/**
 * NotCast Express Uygulaması
 * Ana uygulama kurulumu ve middleware konfigürasyonu
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import passport from "passport";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { env } from "./config/env";
import { logger } from "./shared/utils/logger";
import { errorHandler } from "./shared/middleware/error-handler";
import { apiRateLimiter } from "./shared/middleware/rate-limiter";
import { checkDatabaseConnection } from "./config/database";

// Passport strategies
import { localStrategy } from "./modules/auth/strategies/local.strategy";
import { jwtStrategy } from "./modules/auth/strategies/jwt.strategy";

// Storage
import { ensureBucketExists } from "./shared/services/storage.service";

// Job Workers
import { startNoteProcessingWorker } from "./jobs/note-processing.job";
import { startPodcastGenerationWorker } from "./jobs/podcast-generation.job";

// Route'lar
import { authRouter } from "./modules/auth/auth.routes";
import { usersRouter } from "./modules/users/user.routes";
import { notesRouter } from "./modules/notes/note.routes";
import { podcastsRouter } from "./modules/podcasts/podcast.routes";
import { voicesRouter } from "./modules/voices/voice.routes";

// ──────── Passport Kurulumu ────────
passport.use(localStrategy);
passport.use(jwtStrategy);

const app = express();
const httpServer = createServer(app);

// Socket.IO kurulumu
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.CORS_ORIGINS.split(","),
    credentials: true,
  },
});

// ──────── Güvenlik Middleware'leri ────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "wss:"],
      },
    },
  })
);

app.use(
  cors({
    origin: env.CORS_ORIGINS.split(","),
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ──────── Temel Middleware'ler ────────
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// ──────── Rate Limiting ────────
app.use("/api", apiRateLimiter);

// ──────── Health Check ────────
app.get("/api/health", async (_req, res) => {
  const dbOk = await checkDatabaseConnection();
  const status = dbOk ? "ok" : "degraded";

  res.status(dbOk ? 200 : 503).json({
    success: dbOk,
    data: {
      status,
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      version: process.env["npm_package_version"] ?? "0.1.0",
      services: {
        database: dbOk ? "ok" : "error",
      },
    },
  });
});

// ──────── API Route'ları ────────
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/notes", notesRouter);
app.use("/api/podcasts", podcastsRouter);
app.use("/api/voices", voicesRouter);

// ──────── 404 Handler ────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Endpoint bulunamadı" },
  });
});

// ──────── Global Error Handler ────────
app.use(errorHandler);

// ──────── Socket.IO Bağlantı Yönetimi ────────
io.on("connection", (socket) => {
  logger.debug({ socketId: socket.id }, "Yeni WebSocket bağlantısı");

  // Kullanıcı odasına katıl (token'dan userId çıkar)
  socket.on("subscribe:user", (userId: string) => {
    void socket.join(`user:${userId}`);
  });

  socket.on("subscribe:note", (noteId: string) => {
    void socket.join(`note:${noteId}`);
  });

  socket.on("subscribe:podcast", (podcastId: string) => {
    void socket.join(`podcast:${podcastId}`);
  });

  socket.on("disconnect", () => {
    logger.debug({ socketId: socket.id }, "WebSocket bağlantısı kapandı");
  });
});

// ──────── Graceful Shutdown ────────
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "Graceful shutdown başlatılıyor...");

  httpServer.close(async () => {
    logger.info("HTTP sunucusu kapatıldı");
    try {
      const { disconnectDatabase } = await import("./config/database");
      const { disconnectRedis } = await import("./config/redis");
      await disconnectDatabase();
      await disconnectRedis();
      logger.info("Tüm bağlantılar kapatıldı");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Kapatma hatası");
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => void gracefulShutdown("SIGINT"));

// ──────── Sunucuyu Başlat ────────
httpServer.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, frontend: env.FRONTEND_URL },
    "🚀 NotCast Server çalışıyor"
  );

  // S3 bucket hazır olduğundan emin ol (arka planda)
  ensureBucketExists().catch((err) =>
    logger.error({ err }, "S3 bucket init hatası")
  );

  // Job worker'ları başlat
  startNoteProcessingWorker();
  startPodcastGenerationWorker();
});

export default app;
