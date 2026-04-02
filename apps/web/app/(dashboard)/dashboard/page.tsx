"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-bold tabular-nums">{value}</p>
            )}
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<Note[]>>("/notes?limit=5");
      return data;
    },
  });

  const { data: podcasts, isLoading: podcastsLoading } = useQuery({
    queryKey: ["podcasts"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<PodcastWithNote[]>>("/podcasts?limit=5");
      return data;
    },
  });

  const totalNotes = notes?.meta?.total ?? notes?.data?.length ?? 0;
  const totalPodcasts = podcasts?.meta?.total ?? podcasts?.data?.length ?? 0;
  const readyNotes = notes?.data?.filter((n) => n.status === "READY").length ?? 0;
  const remainingCredits = user
    ? Math.max(0, user.monthlyCredits - user.creditsUsed)
    : 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";

  return (
    <div className="space-y-8">
      {/* Karşılama */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Bugün hangi notunu podcast'e dönüştürmek istersin?
        </p>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Toplam Not"
          value={totalNotes}
          icon={BookOpen}
          sub={`${readyNotes} hazır`}
          loading={notesLoading}
        />
        <StatCard
          label="Toplam Podcast"
          value={totalPodcasts}
          icon={Headphones}
          loading={podcastsLoading}
        />
        <StatCard
          label="Kalan Kredi"
          value={user?.role === "PREMIUM" ? "∞" : remainingCredits}
          icon={CreditCard}
          sub={user?.role === "FREE" ? `${user.creditsUsed}/${user.monthlyCredits} kullanıldı` : "Premium üye"}
        />
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <Upload className="h-5 w-5 opacity-80" />
            <div className="mt-4">
              <p className="text-sm font-medium opacity-90">Yeni Not Yükle</p>
              <Link href="/upload">
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2 w-full"
                >
                  Başla <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* İki Kolon: Son Notlar + Son Podcast'ler */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Son Notlar */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Son Notlar</CardTitle>
            <Link href="/notes" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Tümü <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {notesLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              : notes?.data?.length === 0
              ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Henüz not yok
                </div>
              )
              : notes?.data?.slice(0, 5).map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  {NOTE_STATUS_ICONS[note.status] ?? <Clock className="h-3.5 w-3.5" />}
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

        {/* Son Podcast'ler */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Son Podcast'ler</CardTitle>
            <Link href="/podcasts" className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              Tümü <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {podcastsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              : podcasts?.data?.length === 0
              ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Headphones className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  Henüz podcast yok
                </div>
              )
              : podcasts?.data?.slice(0, 5).map((podcast) => (
                <Link
                  key={podcast.id}
                  href={`/podcasts/${podcast.id}`}
                  className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/50 transition-colors group"
                >
                  {PODCAST_STATUS_ICONS[podcast.status] ?? <Clock className="h-3.5 w-3.5" />}
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
      </div>

      {/* FREE kullanıcı için upgrade CTA */}
      {user?.role === "FREE" && remainingCredits === 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-orange-800 dark:text-orange-200">
                Aylık podcast limitine ulaştınız
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-0.5">
                Premium'a geçerek sınırsız podcast oluşturabilirsiniz.
              </p>
            </div>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white flex-shrink-0">
              Premium'a Geç
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
