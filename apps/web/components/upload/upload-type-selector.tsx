"use client";

import { ImageIcon, FileText, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadMode } from "@/hooks/use-upload";

interface UploadTypeSelectorProps {
  value: UploadMode;
  onChange: (mode: UploadMode) => void;
  disabled?: boolean;
}

const OPTIONS: { value: UploadMode; label: string; desc: string; icon: React.ElementType }[] = [
  {
    value: "file",
    label: "Dosya / Görsel",
    desc: "Fotoğraf, PDF, Word",
    icon: ImageIcon,
  },
  {
    value: "text",
    label: "Metin Yapıştır",
    desc: "Dijital notlar",
    icon: Type,
  },
];

export function UploadTypeSelector({ value, onChange, disabled }: UploadTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {OPTIONS.map(({ value: opt, label, desc, icon: Icon }) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={cn(
            "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === opt
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:border-primary/40 hover:bg-muted/40 text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Icon className="h-6 w-6" />
          <div>
            <p className="text-sm font-medium leading-tight">{label}</p>
            <p className="text-xs opacity-70 mt-0.5">{desc}</p>
          </div>
        </button>
      ))}
    </div>
  );
}

// Kullanılmayan import
void FileText;
