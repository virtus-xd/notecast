"use client";

import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressProps {
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string | null;
}

export function UploadProgress({ status, progress, error }: UploadProgressProps) {
  return (
    <div className="space-y-3">
      {/* Durum ikonu + mesaj */}
      <div className="flex items-center gap-3">
        {status === "uploading" && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
            <span className="text-sm font-medium">
              {progress < 90 ? "Dosya yükleniyor..." : "İşleme alınıyor..."}
            </span>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Yükleme tamamlandı! Not işleniyor...
            </span>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <span className="text-sm font-medium text-destructive">
              {error ?? "Bir hata oluştu"}
            </span>
          </>
        )}
      </div>

      {/* Progress bar */}
      {(status === "uploading" || status === "success") && (
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              status === "success" ? "bg-green-500" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
