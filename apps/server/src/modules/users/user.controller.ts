/**
 * User Controller
 * Profil ve tercih yönetimi
 */

import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import {
  updateUser,
  toSafeUser,
  getRemainingCredits,
} from "./user.repository";
import { changePassword } from "../auth/auth.service";
import { countNotesByUserId } from "../notes/note.repository";
import { countPodcastsByUserId } from "../podcasts/podcast.repository";
import { AppError } from "../../shared/utils/errors";
import {
  UpdateProfileSchema,
  UpdatePreferencesSchema,
  ChangePasswordSchema,
} from "@notcast/shared";

/**
 * PATCH /api/users/profile
 */
export async function updateProfileHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const input = UpdateProfileSchema.parse(req.body);

    const updated = await updateUser(user.id, input);

    res.json({ success: true, data: { user: toSafeUser(updated) } });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/password
 */
export async function changePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(req.body);

    await changePassword(user.id, currentPassword, newPassword);

    res.json({ success: true, data: { message: "Şifre başarıyla değiştirildi" } });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/users/preferences
 */
export async function updatePreferencesHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;
    const input = UpdatePreferencesSchema.parse(req.body);

    const updates: Record<string, unknown> = {};
    if (input.preferredVoiceId !== undefined) {
      updates["preferredVoiceId"] = input.preferredVoiceId;
    }

    const updated = await updateUser(user.id, updates);

    res.json({ success: true, data: { user: toSafeUser(updated) } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/users/usage
 */
export async function getUsageHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user as User;

    const [noteCount, podcastCount] = await Promise.all([
      countNotesByUserId(user.id),
      countPodcastsByUserId(user.id),
    ]);

    res.json({
      success: true,
      data: {
        notes: noteCount,
        podcasts: podcastCount,
        credits: {
          monthly: user.monthlyCredits,
          used: user.creditsUsed,
          remaining: getRemainingCredits(user),
          resetAt: user.creditsResetAt,
        },
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}
