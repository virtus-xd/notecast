"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, BookOpen, Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import apiClient from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/utils";
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
  const { data, isLoading, error } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<Note[]>>("/notes");
      return data.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notlarım</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data ? `${data.length} not` : "Yükleniyor..."}
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
            <Link key={note.id} href={`/notes/${note.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Kullanılmayan import
void formatDate;
