/**
 * Voices route'ları
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { listVoicesHandler, getVoiceHandler, previewVoiceHandler } from "./voice.controller";

export const voicesRouter = Router();

voicesRouter.use(requireAuth);

voicesRouter.get("/", listVoicesHandler);
voicesRouter.get("/:id/preview", previewVoiceHandler);
voicesRouter.get("/:id", getVoiceHandler);
