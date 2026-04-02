"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, ImageIcon, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALLOWED_MIME_TYPES, FILE_LIMITS } from "@notcast/shared";

const ACCEPTED_TYPES = {
  ...Object.fromEntries(ALLOWED_MIME_TYPES.IMAGE.map((t) => [t, []])),
  ...Object.fromEntries(ALLOWED_MIME_TYPES.PDF.map((t) => [t, []])),
  ...Object.fromEntries(ALLOWED_MIME_TYPES.DOCUMENT.map((t) => [t, []])),
};

interface UploadDropzoneProps {
  file: File | null;
  previewUrl: string | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}

export function UploadDropzone({ file, previewUrl, onFile, disabled }: UploadDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: FILE_LIMITS.MAX_PDF_SIZE_BYTES,
    disabled,
  });

  // Dosya seçili — önizleme göster
  if (file) {
    return (
      <div className="relative rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
        <button
          type="button"
          onClick={() => onFile(null)}
          className="absolute top-3 right-3 z-10 rounded-full bg-white dark:bg-gray-800 shadow p-1 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          aria-label="Dosyayı kaldır"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-4">
          {/* Görsel önizleme */}
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Önizleme"
              className="h-20 w-20 rounded-lg object-cover border shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          {/* Dosya bilgileri */}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {file.type} · {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            <span className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-medium">
              <ImageIcon className="h-3 w-3" />
              Yüklenmeye hazır
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all cursor-pointer p-10",
        "flex flex-col items-center justify-center gap-3 text-center",
        isDragActive && !isDragReject && "border-primary bg-primary/5 scale-[1.01]",
        isDragReject && "border-destructive bg-destructive/5",
        !isDragActive && !isDragReject && "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />

      <div
        className={cn(
          "rounded-full p-4 transition-colors",
          isDragActive ? "bg-primary/10" : "bg-muted"
        )}
      >
        <Upload
          className={cn(
            "h-8 w-8 transition-colors",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )}
        />
      </div>

      {isDragReject ? (
        <div>
          <p className="font-semibold text-destructive">Desteklenmeyen dosya türü</p>
          <p className="text-sm text-muted-foreground mt-1">
            JPG, PNG, PDF veya DOCX yükleyebilirsiniz
          </p>
        </div>
      ) : isDragActive ? (
        <p className="font-semibold text-primary">Bırakın!</p>
      ) : (
        <div>
          <p className="font-semibold">
            Dosyanızı sürükleyin veya{" "}
            <span className="text-primary underline underline-offset-2">seçin</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            JPG, PNG, PDF, DOCX · Görsel maks {FILE_LIMITS.MAX_IMAGE_SIZE_MB}MB,
            PDF maks {FILE_LIMITS.MAX_PDF_SIZE_MB}MB
          </p>
        </div>
      )}

      {/* Kamera butonu — mobil */}
      <label className="mt-1 flex items-center gap-2 text-xs text-primary cursor-pointer hover:underline sm:hidden">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        📷 Kamerayla fotoğraf çek
      </label>
    </div>
  );
}
