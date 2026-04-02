"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Trash2,
  FileText,
  Clock,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import apiClient from "@/lib/api";

const AudioPlayer = dynamic(
  () => import("@/components/podcasts/audio-player").then((m) => m.AudioPlayer),
  { ssr: false, loading: () => <div className="h-40 rounded-md bg-muted animate-pulse" /> }
);
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { usePodcastStatus } from "@/hooks/use-podcast-status";
import type { Podcast, ApiSuccessResponse } from "@notcast/shared";

type PodcastWithNote = Podcast & {
  note: { id: string; title: string; subject: string | null };
  audioUrl: string | null;
};

const STATUS_MAP: Record<Podcast["status"], { label: string; className: string }> = {
  PENDING:          { label: "Bekliyor",          className: "bg-gray-100 text-gray-700" },
  SCRIPT_WRITING:   { label: "Script yazılıyor",  className: "bg-blue-100 text-blue-700" },
  GENERATING_AUDIO: { label: "Ses üretiliyor",    className: "bg-blue-100 text-blue-700" },
  MERGING:          { label: "Birleştiriliyor",   className: "bg-blue-100 text-blue-700" },
  READY:            { label: "Hazır",             className: "bg-green-100 text-green-700" },
  ERROR:            { label: "Hata",              className: "bg-red-100 text-red-700" },
};

const STYLE_LABEL: Record<string, string> = {
  educational: "Eğitici",
  conversational: "Sohbet",
  summary: "Özet",
};

export default function PodcastDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: podcast, isLoading, refetch } = useQuery({
    queryKey: ["podcast", id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<PodcastWithNote>>(
        `/podcasts/${id}`
      );
      return data.data;
    },
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (!s) return false;
      return ["PENDING", "SCRIPT_WRITING", "GENERATING_AUDIO", "MERGING"].includes(s)
        ? 5000
        : false;
    },
  });

  const socketStatus = usePodcastStatus(id ?? null);

  const handleDelete = async () => {
    if (!confirm("Bu podcast'i silmek istediğinize emin misiniz?")) return;
    try {
      await apiClient.delete(`/podcasts/${id}`);
      toast.success("Podcast silindi");
      router.push("/podcasts");
    } catch {
      toast.error("Podcast silinemedi");
    }
  };

  const handleRegenerate = async () => {
    try {
      await apiClient.post(`/podcasts/${id}/regenerate`);
      toast.info("Podcast yeniden oluşturuluyor");
      await refetch();
    } catch {
      toast.error("Yeniden oluşturma başlatılamadı");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!podcast) return null;

  const { label, className } = STATUS_MAP[podcast.status] ?? STATUS_MAP["PENDING"];
  const isProcessing = ["PENDING", "SCRIPT_WRITING", "GENERATING_AUDIO", "MERGING"].includes(podcast.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{podcast.title}</h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
              {podcast.status === "READY" && <CheckCircle className="h-3 w-3" />}
              {isProcessing && <Loader2 className="h-3 w-3 animate-spin" />}
              {podcast.status === "ERROR" && <AlertCircle className="h-3 w-3" />}
              {label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(podcast.createdAt)}
            {podcast.note?.subject && <> · <span className="text-primary">{podcast.note.subject}</span></>}
            {" · "}{STYLE_LABEL[podcast.style] ?? podcast.style}
            {" · "}{podcast.voiceName}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {podcast.status === "ERROR" && (
            <Button variant="outline" size="sm" onClick={handleRegenerate}>
              <RefreshCw className="h-4 w-4" /> Tekrar Dene
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Kaynak not */}
      {podcast.note && (
        <button
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => router.push(`/notes/${podcast.note.id}`)}
        >
          <FileText className="h-4 w-4" />
          Kaynak not: <span className="underline underline-offset-2">{podcast.note.title}</span>
        </button>
      )}

      {/* İşleniyor bildirimi */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {socketStatus.message || "Podcast oluşturuluyor..."}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  Bu işlem 1–2 dakika sürebilir.
                </p>
              </div>
            </div>
            {socketStatus.progress > 0 && (
              <div className="h-1.5 w-full rounded-full bg-blue-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${socketStatus.progress}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hata */}
      {podcast.status === "ERROR" && podcast.errorMessage && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> Oluşturma hatası
            </p>
            <p className="text-xs text-muted-foreground mt-1">{podcast.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Ses Oynatıcı */}
      {podcast.status === "READY" && podcast.audioUrl && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Oynatıcı
              </p>
              <a
                href={`${process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api"}/podcasts/${podcast.id}/download?token=${encodeURIComponent(localStorage.getItem("notcast-auth-token") ?? "")}`}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                download
              >
                <Download className="h-3.5 w-3.5" /> İndir
              </a>
            </div>
            <AudioPlayer
              track={{
                podcastId: podcast.id,
                title: podcast.title,
                voiceName: podcast.voiceName,
                subject: podcast.note?.subject ?? null,
                streamUrl: `${process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api"}/podcasts/${podcast.id}/stream?token=${encodeURIComponent(localStorage.getItem("notcast-auth-token") ?? "")}`,
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Script hazır ama ses yok */}
      {podcast.status === "READY" && !podcast.audioUrl && podcast.scriptText && (
        <Card>
          <CardContent className="p-4 text-center text-muted-foreground text-sm">
            Script hazır — ses üretimi tamamlanmadı.
          </CardContent>
        </Card>
      )}

      {/* Script */}
      {podcast.scriptText && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Podcast Script</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {podcast.scriptText}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Bilgi */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {formatDate(podcast.updatedAt, { hour: "2-digit", minute: "2-digit" })} tarihinde güncellendi
      </div>
    </div>
  );
}
