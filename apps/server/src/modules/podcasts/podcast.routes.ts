/**
 * Podcasts route'ları
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
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

// Tüm podcast route'ları kimlik doğrulama gerektiriyor
podcastsRouter.use(requireAuth);

podcastsRouter.get("/", listPodcastsHandler);
podcastsRouter.post("/generate", generatePodcastHandler);
podcastsRouter.get("/:id", getPodcastHandler);
podcastsRouter.delete("/:id", deletePodcastHandler);
podcastsRouter.post("/:id/regenerate", regeneratePodcastHandler);
podcastsRouter.get("/:id/script", getPodcastScriptHandler);
podcastsRouter.get("/:id/status", getPodcastStatusHandler);
podcastsRouter.get("/:id/stream", streamPodcastHandler);
podcastsRouter.get("/:id/download", downloadPodcastHandler);
