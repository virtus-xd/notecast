/**
 * User Route'ları
 * /api/users prefix'i ile kullanılır
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  updateProfileHandler,
  changePasswordHandler,
  updatePreferencesHandler,
  getUsageHandler,
} from "./user.controller";

export const usersRouter = Router();

// Tüm user route'ları auth gerektirir
usersRouter.use(requireAuth);

usersRouter.patch("/profile", updateProfileHandler);
usersRouter.patch("/password", changePasswordHandler);
usersRouter.patch("/preferences", updatePreferencesHandler);
usersRouter.get("/usage", getUsageHandler);
