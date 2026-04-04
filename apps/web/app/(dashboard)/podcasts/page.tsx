"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import {
  Headphones,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Music,
  Search,
  Filter,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api";
import { usePlayerStore } from "@/stores/player.store";
import type { Podcast, ApiSuccessResponse } from "@notcast/shared";

type PodcastWithNote = Podcast & {
  note: { id: string; title: string; subject: string | null };
};

function StatusIcon({ status }: { status: Podcast["status"] }) {
  if (status === "READY") return <CheckCircle className="h-4 w-4 text-green-500" />;
  if (status === "ERROR") return <AlertCircle className="h-4 w-4 text-destructive" />;
  if (["SCRIPT_WRITING", "GENERATING_AUDIO", "MERGING", "PENDING"].includes(status))
    return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  return <Clock className="h-4 w-4 text-muted-foreground" />;
}

const STATUS_LABEL: Record<Podcast["status"], string> = {
  PENDING: "Bekliyor",
  SCRIPT_WRITING: "Script yazılıyor",
  GENERATING_AUDIO: "Ses üretiliyor",
  MERGING: "Birleştiriliyor",
  READY: "Hazır",
  ERROR: "Hata",
};

const STYLE_LABEL: Record<string, string> = {
  educational: "Eğitici",
  conversational: "Sohbet",
  summary: "Özet",
};

const FILTER_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "READY", label: "Hazır" },
  { value: "processing", label: "İşleniyor" },
  { value: "ERROR", label: "Hata" },
] as const;

export default function PodcastsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "READY" | "processing" | "ERROR">("all");
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  const { setTrack, track: currentTrack, isPlaying, play, pause } = usePlayerStore();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: ["podcasts"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<PodcastWithNote[]>>("/podcasts");
      const podcasts = data.data;
      return Array.isArray(podcasts) ? podcasts : [];
    },
    enabled: hasHydrated && isAuthenticated,
    refetchInterval: (query) => {
      const podcasts = query.state.data;
      if (!Array.isArray(podcasts)) return false;
      const hasProcessing = podcasts.some((p) =>
        ["PENDING", "SCRIPT_WRITING", "GENERATING_AUDIO", "MERGING"].includes(p.status)
      );
      return hasProcessing ? 5000 : false;
    },
  });

  const filtered = (data ?? []).filter((p) => {
    const matchesSearch =
      search === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.note?.subject ?? "").toLowerCase().includes(search.toLowerCase()) ||
      p.voiceName.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "processing" &&
        ["PENDING", "SCRIPT_WRITING", "GENERATING_AUDIO", "MERGING"].includes(p.status)) ||
      p.status === filter;

    return matchesSearch && matchesFilter;
  });

  const handlePlayPause = (podcast: PodcastWithNote, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!podcast.audioUrl) return;

    const apiBase = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api";
    const token = localStorage.getItem("notcast-auth-token") ?? "";
    const streamUrl = `${apiBase}/podcasts/${podcast.id}/stream?token=${encodeURIComponent(token)}`;

    if (currentTrack?.podcastId === podcast.id) {
      if (isPlaying) pause();
      else play();
    } else {
      setTrack({
        podcastId: podcast.id,
        title: podcast.title,
        voiceName: podcast.voiceName,
        subject: podcast.note?.subject ?? null,
        streamUrl,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Podcast'lerim</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} / {data?.length ?? 0} podcast
          </p>
        </div>
        <Button onClick={() => router.push("/podcasts/generate")}>
          <Plus className="h-4 w-4" /> Yeni Podcast
        </Button>
      </div>

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Başlık, ders veya ses adı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex gap-1">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  filter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center space-y-4">
            <Music className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              {search || filter !== "all" ? (
                <p className="font-medium">Sonuç bulunamadı</p>
              ) : (
                <>
                  <p className="font-medium">Henüz podcast yok</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Notlarınızdan Türkçe podcast oluşturun.
                  </p>
                </>
              )}
            </div>
            {!search && filter === "all" && (
              <Button onClick={() => router.push("/podcasts/generate")}>
                <Headphones className="h-4 w-4" /> İlk Podcast'i Oluştur
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((podcast) => {
            const isCurrentAndPlaying =
              currentTrack?.podcastId === podcast.id && isPlaying;

            return (
              <Card
                key={podcast.id}
                className={cn(
                  "cursor-pointer hover:border-primary/50 transition-colors",
                  currentTrack?.podcastId === podcast.id && "border-primary/40 bg-primary/[0.02]"
                )}
                onClick={() => router.push(`/podcasts/${podcast.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Play butonu */}
                    <button
                      onClick={(e) => handlePlayPause(podcast, e)}
                      disabled={podcast.status !== "READY" || !podcast.audioUrl}
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                        podcast.status === "READY" && podcast.audioUrl
                          ? "bg-primary/10 hover:bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground cursor-default"
                      )}
                    >
                      {podcast.status === "READY" ? (
                        isCurrentAndPlaying ? (
                          <span className="h-3 w-3 flex gap-0.5">
                            <span className="w-1 bg-primary rounded-sm animate-pulse" />
                            <span className="w-1 bg-primary rounded-sm animate-pulse delay-75" />
                            <span className="w-1 bg-primary rounded-sm animate-pulse delay-150" />
                          </span>
                        ) : (
                          <Play className="h-4 w-4 ml-0.5" />
                        )
                      ) : (
                        <StatusIcon status={podcast.status} />
                      )}
                    </button>

                    {/* Bilgi */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{podcast.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {podcast.note?.subject
                          ? `${podcast.note.subject} · `
                          : ""}
                        {podcast.voiceName} · {STYLE_LABEL[podcast.style] ?? podcast.style}
                      </p>
                    </div>

                    {/* Sağ: süre + tarih + durum */}
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      {podcast.audioDuration ? (
                        <span className="text-xs font-medium text-muted-foreground">
                          {formatDuration(podcast.audioDuration)}
                        </span>
                      ) : (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          podcast.status === "READY"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : podcast.status === "ERROR"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                          {STATUS_LABEL[podcast.status]}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDate(podcast.createdAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
