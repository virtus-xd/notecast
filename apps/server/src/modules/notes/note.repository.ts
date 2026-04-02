/**
 * Note repository
 * Not CRUD operasyonları
 */

import { Note, NoteStatus, Prisma, UploadType } from "@prisma/client";
import { prisma } from "../../config/database";
import type { NoteSection } from "@notcast/shared";

// ──────── Tipler ────────

export type CreateNoteData = {
  userId: string;
  title: string;
  description?: string;
  uploadType: UploadType;
  originalFileUrl: string;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
};

export type UpdateNoteData = Partial<{
  title: string;
  description: string | null;
  tags: string[];
  subject: string | null;
  status: NoteStatus;
  rawExtractedText: string | null;
  processedText: string | null;
  sections: NoteSection[] | null;
  errorMessage: string | null;
  processingStartedAt: Date | null;
  processingCompletedAt: Date | null;
}>;

export type NoteListOptions = {
  userId: string;
  page?: number;
  limit?: number;
  status?: NoteStatus;
  search?: string;
};

// ──────── Sorgular ────────

/**
 * ID ile not bul (kullanıcıya ait olduğunu doğrula)
 */
export async function findNoteById(id: string, userId?: string): Promise<Note | null> {
  return prisma.note.findFirst({
    where: {
      id,
      ...(userId ? { userId } : {}),
    },
  });
}

/**
 * Kullanıcının notlarını sayfalı listele
 */
export async function findNotesByUserId(options: NoteListOptions): Promise<{
  notes: Note[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { userId, page = 1, limit = 20, status, search } = options;

  const where: Prisma.NoteWhereInput = {
    userId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { subject: { contains: search, mode: "insensitive" } },
            { tags: { has: search } },
          ],
        }
      : {}),
  };

  const [notes, total] = await prisma.$transaction([
    prisma.note.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.note.count({ where }),
  ]);

  return {
    notes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Not oluştur
 */
export async function createNote(data: CreateNoteData): Promise<Note> {
  return prisma.note.create({
    data: {
      ...data,
      tags: [],
    },
  });
}

/**
 * Not güncelle
 */
export async function updateNote(id: string, data: UpdateNoteData): Promise<Note> {
  return prisma.note.update({
    where: { id },
    data: data as Prisma.NoteUpdateInput,
  });
}

/**
 * Not işlemeye başladığında durumu güncelle
 */
export async function markNoteProcessingStarted(id: string, status: NoteStatus): Promise<Note> {
  return prisma.note.update({
    where: { id },
    data: {
      status,
      processingStartedAt: new Date(),
      errorMessage: null,
    },
  });
}

/**
 * Not işleme tamamlandığında durumu güncelle
 */
export async function markNoteProcessingCompleted(
  id: string,
  data: Pick<UpdateNoteData, "processedText" | "sections" | "tags" | "subject">
): Promise<Note> {
  return prisma.note.update({
    where: { id },
    data: {
      status: "READY",
      processingCompletedAt: new Date(),
      errorMessage: null,
      ...data,
    } as Prisma.NoteUpdateInput,
  });
}

/**
 * Not işleme hatasında durumu güncelle
 */
export async function markNoteProcessingFailed(id: string, errorMessage: string): Promise<Note> {
  return prisma.note.update({
    where: { id },
    data: {
      status: "ERROR",
      errorMessage,
      processingCompletedAt: new Date(),
    },
  });
}

/**
 * Not sil (ilişkili podcast'ler cascade ile silinir)
 */
export async function deleteNote(id: string): Promise<void> {
  await prisma.note.delete({ where: { id } });
}

/**
 * Belirli durumdaki notları bul (job worker için)
 */
export async function findNotesByStatus(status: NoteStatus, limit = 10): Promise<Note[]> {
  return prisma.note.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

/**
 * Kullanıcının not sayısı
 */
export async function countNotesByUserId(userId: string): Promise<number> {
  return prisma.note.count({ where: { userId } });
}
