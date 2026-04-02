/**
 * Podcasts route'ları
 */

import { Router } from "express";
import { requireAuth, queryTokenAuth } from "../auth/auth.middleware";
import {
  listPodcastsHandler,
  getPodcastHandler,
  generatePodcastHandler,
  deletePodcastHandler,
  regeneratePodcastHandler,
  getPodcastScriptHandler,
  getPodcastStatusHandler,
  downloadPodcastHandler,
  streamPodcastHandler,
} from "./podcast.controller";

export const podcastsRouter = Router();

// Stream ve download — <audio>/<a> elementleri Authorization header gönderemez,
// bu yüzden query param ile token doğrulama kullanılır
podcastsRouter.get("/:id/stream", queryTokenAuth, streamPodcastHandler);
podcastsRouter.get("/:id/download", queryTokenAuth, downloadPodcastHandler);

// Diğer tüm podcast route'ları standard JWT auth gerektirir
podcastsRouter.use(requireAuth);

podcastsRouter.get("/", listPodcastsHandler);
podcastsRouter.post("/generate", generatePodcastHandler);
podcastsRouter.get("/:id", getPodcastHandler);
podcastsRouter.delete("/:id", deletePodcastHandler);
podcastsRouter.post("/:id/regenerate", regeneratePodcastHandler);
podcastsRouter.get("/:id/script", getPodcastScriptHandler);
podcastsRouter.get("/:id/status", getPodcastStatusHandler);
