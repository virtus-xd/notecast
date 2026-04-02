"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { UploadTypeSelector } from "@/components/upload/upload-type-selector";
import { UploadDropzone } from "@/components/upload/upload-dropzone";
import { TextInput } from "@/components/upload/text-input";
import { UploadProgress } from "@/components/upload/upload-progress";
import { useUpload } from "@/hooks/use-upload";

export default function UploadPage() {
  const router = useRouter();
  const { state, setMode, setFile, setText, setTitle, reset, upload } = useUpload();
  const { mode, file, previewUrl, text, title, progress, status, error, createdNote } = state;

  const isUploading = status === "uploading";
  const isSuccess = status === "success";

  // Başarılı yüklemeden sonra notes sayfasına yönlendir
  useEffect(() => {
    if (isSuccess && createdNote) {
      const timer = setTimeout(() => {
        router.push(`/notes/${createdNote.id}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, createdNote, router]);

  const canUpload =
    !isUploading &&
    !isSuccess &&
    (mode === "file" ? !!file : text.trim().length > 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Not Yükle
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ders notunu yükle, yapay zeka ile metne çevrilsin ve podcast hazırlansın.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Yükleme Türü</CardTitle>
          <CardDescription>Notunuzu nasıl eklemek istediğinizi seçin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tür seçimi */}
          <UploadTypeSelector value={mode} onChange={setMode} disabled={isUploading} />

          <Separator />

          {/* Not başlığı */}
          <div className="space-y-2">
            <Label htmlFor="title">Not Başlığı <span className="text-muted-foreground font-normal">(opsiyonel)</span></Label>
            <Input
              id="title"
              placeholder="Örn: Biyokimya — Enzim Kinetiği"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUploading}
              maxLength={255}
            />
          </div>

          {/* Dosya / Metin alanı */}
          {mode === "file" ? (
            <UploadDropzone
              file={file}
              previewUrl={previewUrl}
              onFile={setFile}
              disabled={isUploading}
            />
          ) : (
            <TextInput value={text} onChange={setText} disabled={isUploading} />
          )}

          {/* İlerleme / Hata */}
          {(status === "uploading" || status === "success" || status === "error") && (
            <UploadProgress status={status} progress={progress} error={error} />
          )}

          {/* Butonlar */}
          <div className="flex gap-3">
            {isSuccess ? (
              <Button
                className="flex-1"
                onClick={() => createdNote && router.push(`/notes/${createdNote.id}`)}
              >
                Notu Görüntüle <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={reset}
                  disabled={isUploading}
                  className="w-28"
                >
                  Temizle
                </Button>
                <Button
                  className="flex-1"
                  onClick={upload}
                  disabled={!canUpload}
                >
                  {isUploading ? "Yükleniyor..." : "Yükle ve İşle"}
                  {!isUploading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bilgi kartı */}
      <div className="rounded-xl bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-brand-700 dark:text-brand-300">
          📋 Desteklenen Formatlar
        </h3>
        <ul className="text-xs text-brand-600 dark:text-brand-400 space-y-1">
          <li>• <strong>Görsel:</strong> JPG, PNG (el yazısı + basılı metin)</li>
          <li>• <strong>PDF:</strong> Tek veya çok sayfalı ders notları</li>
          <li>• <strong>Belge:</strong> Word (.docx) dosyaları</li>
          <li>• <strong>Metin:</strong> Dijital notları yapıştır</li>
        </ul>
      </div>
    </div>
  );
}
