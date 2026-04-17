"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import {
  ArrowLeft,
  Headphones,
  RefreshCw,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Tag,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import apiClient from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useNoteStatus } from "@/hooks/use-note-status";
import type { Note, ApiSuccessResponse } from "@notcast/shared";

function StatusBadge({ status }: { status: Note["status"] }) {
  const map: Record<Note["status"], { label: string; className: string }> = {
    UPLOADED:        { label: "Yüklendi",         className: "bg-gray-100 text-gray-700" },
    PREPROCESSING:   { label: "Ön işleme",        className: "bg-blue-100 text-blue-700" },
    OCR_PROCESSING:  { label: "OCR işleniyor",    className: "bg-blue-100 text-blue-700" },
    TEXT_EXTRACTED:  { label: "Metin çıkarıldı",  className: "bg-blue-100 text-blue-700" },
    ANALYZING:       { label: "Analiz ediliyor",  className: "bg-purple-100 text-purple-700" },
    READY:           { label: "Hazır",            className: "bg-green-100 text-green-700" },
    ERROR:           { label: "Hata",             className: "bg-red-100 text-red-700" },
  };
  const { label, className } = map[status] ?? map["UPLOADED"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
      {status === "READY" && <CheckCircle className="h-3 w-3" />}
      {["PREPROCESSING","OCR_PROCESSING","TEXT_EXTRACTED","ANALYZING"].includes(status) && (
        <Loader2 className="h-3 w-3 animate-spin" />
      )}
      {status === "ERROR" && <AlertCircle className="h-3 w-3" />}
      {label}
    </span>
  );
}

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: note, isLoading, refetch } = useQuery({
    queryKey: ["note", id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<Note & { fileUrl?: string }>>(
        `/notes/${id}`
      );
      return data.data;
    },
    enabled: isAuthenticated && !!id,
    // Fallback: WebSocket yoksa 5sn'de bir polling
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      if (!s) return false;
      return ["UPLOADED","PREPROCESSING","OCR_PROCESSING","TEXT_EXTRACTED","ANALYZING"].includes(s)
        ? 5000
        : false;
    },
  });

  // WebSocket ile gerçek zamanlı durum takibi
  const socketStatus = useNoteStatus(id ?? null);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/notes/${id}`);
    },
    onSuccess: () => {
      toast.success("Not başarıyla silindi");
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      router.push("/notes");
    },
    onError: () => {
      toast.error("Not silinemedi");
    },
  });

  const handleReprocess = async () => {
    try {
      await apiClient.post(`/notes/${id}/reprocess`);
      toast.info("Not yeniden işlemeye alındı");
      await refetch();
    } catch {
      toast.error("Yeniden işleme başlatılamadı");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!note) return null;

  const sections = note.sections as Array<{ title: string; content: string; order: number }> | null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{note.title}</h1>
            <StatusBadge status={note.status} />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDate(note.createdAt)}
            {note.subject && <> · <span className="text-primary">{note.subject}</span></>}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {note.status === "READY" && (
            <Button asChild size="sm">
              <a href={`/podcasts/generate?noteId=${note.id}`}>
                <Headphones className="h-4 w-4" /> Podcast Oluştur
              </a>
            </Button>
          )}
          {note.status === "ERROR" && (
            <Button variant="outline" size="sm" onClick={handleReprocess}>
              <RefreshCw className="h-4 w-4" /> Tekrar Dene
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Etiketler */}
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">
              <Tag className="h-3 w-3" /> {tag}
            </span>
          ))}
        </div>
      )}

      {/* AI Özeti */}
      {note.status === "READY" && note.description && (
        <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 italic">
          {note.description}
        </p>
      )}

      {/* İşleniyor bildirimi */}
      {["UPLOADED","PREPROCESSING","OCR_PROCESSING","TEXT_EXTRACTED","ANALYZING"].includes(note.status) && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {socketStatus.message || "Not işleniyor..."}
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
      {note.status === "ERROR" && note.errorMessage && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> İşleme hatası
            </p>
            <p className="text-xs text-muted-foreground mt-1">{note.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* İçerik bölümleri */}
      {sections && sections.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Düzenlenmiş İçerik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {sections
              .sort((a, b) => a.order - b.order)
              .map((section, i) => (
                <div key={i}>
                  {section.title && (
                    <>
                      <h3 className="font-semibold text-sm mb-2">{section.title}</h3>
                      <Separator className="mb-3" />
                    </>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {section.content}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      ) : note.processedText ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Metin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {note.processedText}
            </p>
          </CardContent>
        </Card>
      ) : note.status === "READY" ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <p className="text-sm">İçerik yüklenemedi.</p>
          </CardContent>
        </Card>
      ) : null}

      {/* Bilgi */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {note.processingCompletedAt
          ? `${formatDate(note.processingCompletedAt, { hour: "2-digit", minute: "2-digit" })} tarihinde işlendi`
          : "Henüz işlenmedi"}
      </div>

      {/* Silme Onay Dialogu */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{note.title}"</strong> notunu silmek istediğinize emin misiniz?
              Bu nota ait tüm podcast'ler de kalıcı olarak silinecektir.
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Siliniyor...</>
              ) : (
                "Evet, Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
