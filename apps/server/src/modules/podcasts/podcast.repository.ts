/**
 * Podcast repository
 * Podcast CRUD operasyonları
 */

import { Podcast, PodcastStatus, Prisma } from "@prisma/client";
import { prisma } from "../../config/database";

// ──────── Tipler ────────

export type CreatePodcastData = {
  userId: string;
  noteId: string;
  title: string;
  description?: string;
  voiceId: string;
  voiceName: string;
  style?: string;
  speed?: number;
};

export type UpdatePodcastData = Partial<{
  title: string;
  description: string | null;
  status: PodcastStatus;
  scriptText: string | null;
  audioUrl: string | null;
  audioDuration: number | null;
  audioSizeBytes: number | null;
  errorMessage: string | null;
}>;

export type PodcastListOptions = {
  userId: string;
  page?: number;
  limit?: number;
  status?: PodcastStatus;
};

// Not ile birlikte podcast (ilişkili veri)
export type PodcastWithNote = Podcast & {
  note: { id: string; title: string; subject: string | null };
};

// ──────── Sorgular ────────

/**
 * ID ile podcast bul
 */
export async function findPodcastById(
  id: string,
  userId?: string
): Promise<Podcast | null> {
  return prisma.podcast.findFirst({
    where: {
      id,
      ...(userId ? { userId } : {}),
    },
  });
}

/**
 * ID ile podcast bul (not bilgisi dahil)
 */
export async function findPodcastWithNoteById(
  id: string,
  userId?: string
): Promise<PodcastWithNote | null> {
  return prisma.podcast.findFirst({
    where: {
      id,
      ...(userId ? { userId } : {}),
    },
    include: {
      note: {
        select: { id: true, title: true, subject: true },
      },
    },
  });
}

/**
 * Kullanıcının podcast'lerini sayfalı listele
 */
export async function findPodcastsByUserId(options: PodcastListOptions): Promise<{
  podcasts: PodcastWithNote[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { userId, page = 1, limit = 20, status } = options;

  const where: Prisma.PodcastWhereInput = {
    userId,
    ...(status ? { status } : {}),
  };

  const [podcasts, total] = await prisma.$transaction([
    prisma.podcast.findMany({
      where,
      include: {
        note: { select: { id: true, title: true, subject: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.podcast.count({ where }),
  ]);

  return {
    podcasts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Bir nota ait podcast'leri listele
 */
export async function findPodcastsByNoteId(noteId: string): Promise<Podcast[]> {
  return prisma.podcast.findMany({
    where: { noteId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Podcast oluştur
 */
export async function createPodcast(data: CreatePodcastData): Promise<Podcast> {
  return prisma.podcast.create({ data });
}

/**
 * Podcast güncelle
 */
export async function updatePodcast(id: string, data: UpdatePodcastData): Promise<Podcast> {
  return prisma.podcast.update({
    where: { id },
    data: data as Prisma.PodcastUpdateInput,
  });
}

/**
 * Podcast durumunu güncelle
 */
export async function updatePodcastStatus(
  id: string,
  status: PodcastStatus,
  errorMessage?: string
): Promise<Podcast> {
  return prisma.podcast.update({
    where: { id },
    data: {
      status,
      ...(errorMessage ? { errorMessage } : { errorMessage: null }),
    },
  });
}

/**
 * Podcast sil
 */
export async function deletePodcast(id: string): Promise<void> {
  await prisma.podcast.delete({ where: { id } });
}

/**
 * Kullanıcının bu ayki podcast sayısı
 */
export async function countPodcastsThisMonth(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.podcast.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth },
      status: { not: "ERROR" },
    },
  });
}

/**
 * Belirli durumdaki podcast'leri bul (job worker için)
 */
export async function findPodcastsByStatus(
  status: PodcastStatus,
  limit = 10
): Promise<Podcast[]> {
  return prisma.podcast.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

/**
 * Kullanıcının toplam podcast sayısı
 */
export async function countPodcastsByUserId(userId: string): Promise<number> {
  return prisma.podcast.count({ where: { userId } });
}
