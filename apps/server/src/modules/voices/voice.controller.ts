/**
 * Voice Controller
 * Ses listesi ve önizleme
 */

import { Request, Response, NextFunction } from "express";
import { findActiveVoices, findVoiceById } from "./voice.repository";
import { generatePreview } from "../../shared/services/elevenlabs.service";
import { AppError } from "../../shared/utils/errors";

/**
 * GET /api/voices
 * Tüm aktif sesleri listele
 */
export async function listVoicesHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const voices = await findActiveVoices();
    res.json({ success: true, data: voices });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/voices/:id
 * Ses detayı
 */
export async function getVoiceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const voice = await findVoiceById(id);
    if (!voice || !voice.isActive) return next(AppError.notFound("Ses"));
    res.json({ success: true, data: voice });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/voices/:id/preview
 * Ses önizleme — ElevenLabs ile kısa örnek üretir, MP3 stream olarak döner
 */
export async function previewVoiceHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params as { id: string };
    const voice = await findVoiceById(id);
    if (!voice || !voice.isActive) return next(AppError.notFound("Ses"));

    // Önceden kaydedilmiş önizleme URL'si varsa redirect et
    if (voice.previewUrl) {
      res.redirect(voice.previewUrl);
      return;
    }

    // ElevenLabs ile gerçek zamanlı üret
    const audioBuffer = await generatePreview(voice.elevenLabsId);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length.toString());
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(audioBuffer);
  } catch (err) {
    next(err);
  }
}
