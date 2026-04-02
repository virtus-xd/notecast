/**
 * NotCast — Paylaşılan Zod şemaları
 * Frontend ve Backend'de ortak validasyon kuralları
 */

import { z } from "zod";

// ──────── Auth Şemaları ────────

export const RegisterSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z
    .string()
    .min(8, "Şifre en az 8 karakter olmalı")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli")
    .regex(/[0-9]/, "Şifre en az bir rakam içermeli")
    .regex(/[!@#$%^&*]/, "Şifre en az bir özel karakter içermeli (!@#$%^&*)"),
  name: z
    .string()
    .min(2, "İsim en az 2 karakter olmalı")
    .max(100, "İsim en fazla 100 karakter olabilir"),
});

export const LoginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi girin"),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token gerekli"),
    password: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalı")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli")
      .regex(/[0-9]/, "Şifre en az bir rakam içermeli")
      .regex(/[!@#$%^&*]/, "Şifre en az bir özel karakter içermeli"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
    newPassword: z
      .string()
      .min(8, "Şifre en az 8 karakter olmalı")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermeli")
      .regex(/[0-9]/, "Şifre en az bir rakam içermeli")
      .regex(/[!@#$%^&*]/, "Şifre en az bir özel karakter içermeli"),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmNewPassword"],
  });

// ──────── Not Şemaları ────────

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  subject: z.string().max(100).optional(),
});

// ──────── Podcast Şemaları ────────

export const GeneratePodcastSchema = z.object({
  noteId: z.string().cuid("Geçersiz not ID"),
  voiceId: z.string().min(1, "Ses seçimi gerekli"),
  style: z.enum(["educational", "conversational", "summary"]).default("educational"),
  speed: z.number().min(0.5).max(2.0).default(1.0),
});

// ──────── Kullanıcı Şemaları ────────

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const UpdatePreferencesSchema = z.object({
  preferredVoiceId: z.string().optional().nullable(),
  defaultPodcastStyle: z
    .enum(["educational", "conversational", "summary"])
    .optional(),
});

// ──────── Sayfalama Şemaları ────────

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  sortBy: z.string().optional(),
});

export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// ──────── Çıkarılan Tipler ────────

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type GeneratePodcastInput = z.infer<typeof GeneratePodcastSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type CursorPaginationInput = z.infer<typeof CursorPaginationSchema>;
