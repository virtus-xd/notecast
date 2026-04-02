"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Headphones,
  Mic2,
  Loader2,
  CheckCircle,
  BookOpen,
  MessageCircle,
  AlignLeft,
  Play,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { usePodcastStatus } from "@/hooks/use-podcast-status";
import type { Voice, Note, Podcast, ApiSuccessResponse } from "@notcast/shared";

// ──────── Stil Tanımları ────────

const STYLES = [
  {
    id: "educational" as const,
    label: "Eğitici",
    description: "Ders anlatır gibi, açıklayıcı ve öğretici",
    icon: BookOpen,
  },
  {
    id: "conversational" as const,
    label: "Sohbet",
    description: "Arkadaşça, samimi ve doğal bir dil",
    icon: MessageCircle,
  },
  {
    id: "summary" as const,
    label: "Özet",
    description: "Kısa ve öz, temel noktaları vurgular",
    icon: AlignLeft,
  },
] as const;

type PodcastStyle = "educational" | "conversational" | "summary";

// ──────── Oluşturuluyor Durumu ────────

function GeneratingCard({ podcastId }: { podcastId: string }) {
  const status = usePodcastStatus(podcastId);
  const router = useRouter();

  if (status.status === "READY") {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">Podcast hazır!</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">Script oluşturuldu — ses üretimi yakında eklenecek.</p>
          </div>
          <Button onClick={() => router.push(`/podcasts/${podcastId}`)}>
            Podcast'e Git
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status.status === "ERROR") {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="p-6 text-center space-y-3">
          <p className="font-semibold text-destructive">Bir hata oluştu</p>
          <p className="text-sm text-muted-foreground">{status.message}</p>
          <Button variant="outline" onClick={() => router.push("/podcasts")}>
            Geri Dön
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-blue-800 dark:text-blue-200">
              {status.message || "Podcast oluşturuluyor..."}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              Bu işlem 1–2 dakika sürebilir.
            </p>
          </div>
        </div>
        {status.progress > 0 && (
          <div className="h-2 w-full rounded-full bg-blue-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-500"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ──────── Ana Sayfa ────────

function GeneratePodcastContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedNoteId = searchParams.get("noteId") ?? "";

  const [selectedNoteId, setSelectedNoteId] = useState(preselectedNoteId);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<PodcastStyle>("educational");
  const [createdPodcastId, setCreatedPodcastId] = useState<string | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioEl] = useState(() => typeof window !== "undefined" ? new Audio() : null);

  // Notları çek
  const { data: notesData } = useQuery({
    queryKey: ["notes", "ready"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<Note[]>>("/notes?limit=50");
      return data.data.filter((n) => n.status === "READY");
    },
  });

  // Sesleri çek
  const { data: voices, isLoading: voicesLoading } = useQuery({
    queryKey: ["voices"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<Voice[]>>("/voices");
      return data.data;
    },
  });

  const selectedNote = notesData?.find((n) => n.id === selectedNoteId);

  // Podcast oluştur
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiSuccessResponse<{ podcast: Podcast }>>(
        "/podcasts/generate",
        {
          noteId: selectedNoteId,
          voiceId: selectedVoiceId,
          style: selectedStyle,
          speed: 1.0,
        }
      );
      return data.data.podcast;
    },
    onSuccess: (podcast) => {
      setCreatedPodcastId(podcast.id);
      toast.success("Podcast oluşturulmaya başlandı");
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(err.response?.data?.error?.message ?? "Podcast oluşturulamadı");
    },
  });

  const handlePreview = (voiceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioEl) return;

    if (playingVoiceId === voiceId) {
      audioEl.pause();
      audioEl.src = "";
      setPlayingVoiceId(null);
      return;
    }

    const previewUrl = `${process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api"}/voices/${voiceId}/preview`;
    audioEl.src = previewUrl;
    audioEl.onended = () => setPlayingVoiceId(null);
    void audioEl.play().then(() => setPlayingVoiceId(voiceId)).catch(() => setPlayingVoiceId(null));
  };

  const canGenerate =
    selectedNoteId && selectedVoiceId && !generateMutation.isPending;

  if (createdPodcastId) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Podcast Oluşturuluyor</h1>
        </div>
        <GeneratingCard podcastId={createdPodcastId} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Podcast Oluştur</h1>
          <p className="text-sm text-muted-foreground">Notunuzdan Türkçe podcast üretin</p>
        </div>
      </div>

      {/* Adım 1: Not seçimi */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            1. Not Seçin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!notesData || notesData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Hazır not bulunamadı. Önce bir not yükleyin.
            </p>
          ) : (
            notesData.map((note) => (
              <button
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedNoteId === note.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <p className="font-medium text-sm">{note.title}</p>
                {note.subject && (
                  <p className="text-xs text-muted-foreground mt-0.5">{note.subject}</p>
                )}
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Adım 2: Stil seçimi */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            2. Podcast Stili
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {STYLES.map(({ id, label, description, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedStyle(id)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedStyle === id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${selectedStyle === id ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-medium text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Adım 3: Ses seçimi */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            3. Ses Seçin
          </CardTitle>
        </CardHeader>
        <CardContent>
          {voicesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {voices?.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoiceId(voice.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedVoiceId === voice.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      selectedVoiceId === voice.id ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <Mic2 className={`h-4 w-4 ${selectedVoiceId === voice.id ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{voice.name}</p>
                      {voice.description && (
                        <p className="text-xs text-muted-foreground truncate">{voice.description}</p>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground capitalize">
                        {voice.gender === "male" ? "Erkek" : "Kadın"}
                      </span>
                      <button
                        onClick={(e) => handlePreview(voice.id, e)}
                        className="p-1.5 rounded-md hover:bg-muted transition-colors"
                        title="Önizle"
                      >
                        {playingVoiceId === voice.id
                          ? <Square className="h-3.5 w-3.5 text-primary" />
                          : <Play className="h-3.5 w-3.5 text-muted-foreground" />
                        }
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Özet ve oluştur butonu */}
      {selectedNote && selectedVoiceId && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-1.5 text-sm">
          <p><span className="text-muted-foreground">Not:</span> <span className="font-medium">{selectedNote.title}</span></p>
          <p><span className="text-muted-foreground">Stil:</span> <span className="font-medium">{STYLES.find((s) => s.id === selectedStyle)?.label}</span></p>
          <p><span className="text-muted-foreground">Ses:</span> <span className="font-medium">{voices?.find((v) => v.id === selectedVoiceId)?.name}</span></p>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!canGenerate}
        onClick={() => generateMutation.mutate()}
      >
        {generateMutation.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Oluşturuluyor...</>
        ) : (
          <><Headphones className="h-4 w-4" /> Podcast Oluştur</>
        )}
      </Button>
    </div>
  );
}

export default function GeneratePodcastPage() {
  return (
    <Suspense>
      <GeneratePodcastContent />
    </Suspense>
  );
}
