"use client";

import { Type } from "lucide-react";

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

const MAX_CHARS = 50_000;

export function TextInput({ value, onChange, disabled }: TextInputProps) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          disabled={disabled}
          placeholder="Ders notlarınızı buraya yapıştırın...&#10;&#10;Örnek: Osmotik basınç, çözeltinin konsantrasyonuna bağlıdır. Van't Hoff denklemi: π = MRT..."
          className="w-full min-h-[240px] resize-y rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 leading-relaxed"
          spellCheck
          lang="tr"
        />
        <Type className="absolute top-3 right-3 h-4 w-4 text-muted-foreground/40 pointer-events-none" />
      </div>

      {/* Karakter sayacı */}
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>{value.length > 0 ? `${value.length.toLocaleString("tr-TR")} karakter` : "Boş"}</span>
        <span
          className={value.length > MAX_CHARS * 0.9 ? "text-orange-500 font-medium" : ""}
        >
          Maks {MAX_CHARS.toLocaleString("tr-TR")}
        </span>
      </div>
    </div>
  );
}
