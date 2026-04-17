"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, BookOpen, Clock, CheckCircle, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatDate, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import type { Note, ApiSuccessResponse } from "@notcast/shared";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  READY: <CheckCircle className="h-4 w-4 text-green-500" />,
  ERROR: <AlertCircle className="h-4 w-4 text-destructive" />,
  UPLOADED: <Clock className="h-4 w-4 text-muted-foreground" />,
  PREPROCESSING: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  OCR_PROCESSING: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  TEXT_EXTRACTED: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
  ANALYZING: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
};

const STATUS_LABELS: Record<string, string> = {
  READY: "Hazır",
  ERROR: "Hata",
  UPLOADED: "Yüklendi",
  PREPROCESSING: "Ön işleme",
  OCR_PROCESSING: "OCR",
  TEXT_EXTRACTED: "Metin çıkarıldı",
  ANALYZING: "Analiz ediliyor",
};

const UPLOAD_TYPE_ICONS: Record<string, string> = {
  IMAGE: "🖼️",
  PDF: "📄",
  TEXT: "📝",
  DOCUMENT: "📋",
};

export default function NotesPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<Note[]>>("/notes");
      const notes = data.data;
      return Array.isArray(notes) ? notes : [];
    },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiClient.delete(`/notes/${noteId}`);
    },
    onSuccess: () => {
      toast.success("Not başarıyla silindi");
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error("Not silinemedi");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notlarım</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {Array.isArray(data) ? `${data.length} not` : "Yükleniyor..."}
          </p>
        </div>
        <Button asChild>
          <Link href="/upload">
            <Plus className="h-4 w-4" /> Not Yükle
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
          <p>Notlar yüklenemedi</p>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="font-semibold text-lg">Henüz not yok</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-6">
            İlk notunu yükle, yapay zeka ile podcast'e dönüştür
          </p>
          <Button asChild>
            <Link href="/upload"><Plus className="h-4 w-4" /> İlk Notunu Yükle</Link>
          </Button>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-3">
          {data.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-4 flex items-center gap-4">
                <Link href={`/notes/${note.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {UPLOAD_TYPE_ICONS[note.uploadType] ?? "📝"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{note.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{timeAgo(note.createdAt)}</span>
                      {note.subject && (
                        <span className="text-xs text-primary">{note.subject}</span>
                      )}
                      {note.tags.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {note.tags.slice(0, 2).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {STATUS_ICONS[note.status]}
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {STATUS_LABELS[note.status]}
                    </span>
                  </div>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDeleteTarget(note);
                  }}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                  title="Notu sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Silme Onay Dialogu */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Notu Sil</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteTarget?.title}"</strong> notunu silmek istediğinize emin misiniz?
              Bu nota ait tüm podcast'ler de kalıcı olarak silinecektir.
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
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

// Kullanılmayan import
void formatDate;
