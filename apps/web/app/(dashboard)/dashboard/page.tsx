"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Headphones,
  Upload,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BlurFade } from "@/components/ui/blur-fade";
import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";
import { timeAgo } from "@/lib/utils";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import type { Note, Podcast, ApiSuccessResponse } from "@notcast/shared";

type PodcastWithNote = Podcast & {
  note: { id: string; title: string; subject: string | null };
};

const NOTE_STATUS_ICONS: Record<string, React.ReactNode> = {
  READY: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  ERROR: <AlertCircle className="h-3.5 w-3.5 text-destructive" />,
  ANALYZING: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
  OCR_PROCESSING: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
  PREPROCESSING: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
  TEXT_EXTRACTED: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
  UPLOADED: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
};

const PODCAST_STATUS_ICONS: Record<string, React.ReactNode> = {
  READY: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  ERROR: <AlertCircle className="h-3.5 w-3.5 text-destructive" />,
  SCRIPT_WRITING: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
  GENERATING_AUDIO: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
  MERGING: <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />,
  PENDING: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: notesResponse, isLoading: notesLoading } = useQuery({
    queryKey: ["dashboard-notes"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<Note[]>>("/notes?limit=5");
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: podcastsResponse, isLoading: podcastsLoading } = useQuery({
    queryKey: ["dashboard-podcasts"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<PodcastWithNote[]>>("/podcasts?limit=5");
      return data;
    },
    enabled: isAuthenticated,
  });

  const notes = notesResponse?.data;
  const podcasts = podcastsResponse?.data;
  const totalNotes = notesResponse?.meta?.total ?? notes?.length ?? 0;
  const totalPodcasts = podcastsResponse?.meta?.total ?? podcasts?.length ?? 0;
  const readyNotes = Array.isArray(notes) ? notes.filter((n) => n.status === "READY").length : 0;
  const remainingCredits = user
    ? Math.max(0, user.monthlyCredits - user.creditsUsed)
    : 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  const loading = notesLoading || podcastsLoading;

  const bentoItems: BentoItem[] = [
    {
      title: "Toplam Not",
      icon: <BookOpen className="h-4.5 w-4.5 text-primary" />,
      status: `${readyNotes} hazır`,
      hasPersistentHover: false,
      onClick: () => router.push("/notes"),
      cta: "Tümünü gör →",
      children: loading ? (
        <Skeleton className="h-9 w-20 mt-1" />
      ) : (
        <div className="space-y-1">
          <p className="text-3xl font-bold tabular-nums tracking-tight">{totalNotes}</p>
          <p className="text-xs text-muted-foreground">not yüklendi</p>
        </div>
      ),
    },
    {
      title: "Toplam Podcast",
      icon: <Headphones className="h-4.5 w-4.5 text-primary" />,
      hasPersistentHover: false,
      onClick: () => router.push("/podcasts"),
      cta: "Tümünü gör →",
      children: loading ? (
        <Skeleton className="h-9 w-20 mt-1" />
      ) : (
        <div className="space-y-1">
          <p className="text-3xl font-bold tabular-nums tracking-tight">{totalPodcasts}</p>
          <p className="text-xs text-muted-foreground">podcast oluşturuldu</p>
        </div>
      ),
    },
    {
      title: "Kalan Kredi",
      icon: <CreditCard className="h-4.5 w-4.5 text-primary" />,
      status: user?.role === "PREMIUM" ? "Premium" : "Ücretsiz",
      hasPersistentHover: false,
      children: (
        <div className="space-y-1">
          <p className="text-3xl font-bold tabular-nums tracking-tight">
            {user?.role === "PREMIUM" ? "∞" : remainingCredits}
          </p>
          <p className="text-xs text-muted-foreground">
            {user?.role === "FREE"
              ? `${user.creditsUsed}/${user.monthlyCredits} kullanıldı`
              : "Sınırsız podcast"}
          </p>
        </div>
      ),
    },
    {
      title: "Hızlı Başla",
      icon: <Upload className="h-4.5 w-4.5 text-white" />,
      hasPersistentHover: true,
      className:
        "bg-gradient-to-br from-[#00c3ff] to-[#0088cc] text-white border-[#00c3ff]/40 hover:shadow-[0_4px_20px_rgba(0,195,255,0.25)]",
      children: (
        <div className="space-y-3">
          <p className="text-sm font-medium text-white/90">
            Not yükle, podcast oluştur
          </p>
          <Link href="/upload">
            <Button
              size="sm"
              variant="secondary"
              className="w-full bg-white/20 text-white border-white/20 hover:bg-white/30 backdrop-blur-sm"
            >
              Not Yükle <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting with BlurFade */}
      <div>
        <BlurFade delay={0}>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
          </h1>
        </BlurFade>
        <BlurFade delay={0.1}>
          <p className="text-muted-foreground mt-1 text-sm">
            Bugün hangi notunu podcast&apos;e dönüştürmek istersin?
          </p>
        </BlurFade>
      </div>

      {/* Bento Grid Stats */}
      <BlurFade delay={0.2}>
        <BentoGrid items={bentoItems} className="md:grid-cols-4" />
      </BlurFade>

      {/* Son Notlar + Son Podcast'ler */}
      <div className="grid md:grid-cols-2 gap-6">
        <BlurFade delay={0.3}>
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Son Notlar</CardTitle>
              <Link
                href="/notes"
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Tümü <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {notesLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))
                : !notes?.length
                ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Henüz not yok
                  </div>
                )
                : notes.slice(0, 5).map((note) => (
                  <Link
                    key={note.id}
                    href={`/notes/${note.id}`}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-all duration-200 group"
                  >
                    <div className="flex-shrink-0">
                      {NOTE_STATUS_ICONS[note.status] ?? <Clock className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {note.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{timeAgo(note.createdAt)}</p>
                    </div>
                    {note.status === "READY" && (
                      <Link
                        href={`/podcasts/generate?noteId=${note.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2">
                          <Headphones className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </Link>
                ))}
            </CardContent>
          </Card>
        </BlurFade>

        <BlurFade delay={0.4}>
          <Card className="h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Son Podcast&apos;ler</CardTitle>
              <Link
                href="/podcasts"
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
              >
                Tümü <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {podcastsLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-3/4" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))
                : !podcasts?.length
                ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    <Headphones className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Henüz podcast yok
                  </div>
                )
                : podcasts.slice(0, 5).map((podcast) => (
                  <Link
                    key={podcast.id}
                    href={`/podcasts/${podcast.id}`}
                    className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-all duration-200 group"
                  >
                    <div className="flex-shrink-0">
                      {PODCAST_STATUS_ICONS[podcast.status] ?? <Clock className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {podcast.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {podcast.voiceName} · {timeAgo(podcast.createdAt)}
                      </p>
                    </div>
                  </Link>
                ))}
            </CardContent>
          </Card>
        </BlurFade>
      </div>

      {/* Upgrade CTA */}
      {user?.role === "FREE" && remainingCredits === 0 && (
        <BlurFade delay={0.5}>
          <Card className="border-[#00c3ff]/20 bg-gradient-to-r from-[#00c3ff]/5 via-transparent to-[#00c3ff]/5 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,195,255,0.03)_1px,transparent_1px)] bg-[length:4px_4px]" />
            <CardContent className="p-5 flex items-center justify-between gap-4 relative">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#00c3ff]/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-[#00c3ff]" />
                </div>
                <div>
                  <p className="font-semibold text-sm">
                    Aylık podcast limitine ulaştınız
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Premium&apos;a geçerek sınırsız podcast oluşturabilirsiniz.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-[#00c3ff] hover:bg-[#00b0e6] text-white flex-shrink-0"
              >
                Premium&apos;a Geç
              </Button>
            </CardContent>
          </Card>
        </BlurFade>
      )}
    </div>
  );
}
