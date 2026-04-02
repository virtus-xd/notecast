"use client";

/**
 * Mini Player — Dashboard alt kısmında sabit, sayfa geçişlerinde aktif kalır
 */

import { useEffect, useRef, useCallback } from "react";
import { Play, Pause, X, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player.store";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MiniPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    track,
    isPlaying,
    currentTime,
    duration,
    volume,
    speed,
    isMiniPlayer,
    play,
    pause,
    stop,
    setCurrentTime,
    setDuration,
  } = usePlayerStore();

  // Audio element'i oluştur
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onEnded = () => { pause(); setCurrentTime(0); };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track değişince src güncelle
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    audio.src = track.streamUrl;
    audio.load();
  }, [track?.streamUrl]);

  // Play/Pause sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      void audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Hız sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // Ses sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Mini player: track var, isMiniPlayer true ise görün
  if (!track || !isMiniPlayer) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t shadow-lg">
      {/* İlerleme çubuğu (tıklanabilir) */}
      <button
        className="w-full h-1 bg-muted hover:h-1.5 transition-all group"
        onClick={(e) => {
          const audio = audioRef.current;
          if (!audio || !duration) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          audio.currentTime = ratio * duration;
        }}
        aria-label="İlerleme çubuğu"
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </button>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center gap-4 h-14">
          {/* İkon */}
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Headphones className="h-4 w-4 text-primary" />
          </div>

          {/* Bilgi */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{track.title}</p>
            <p className="text-xs text-muted-foreground truncate">{track.voiceName}</p>
          </div>

          {/* Süre */}
          <span className="text-xs text-muted-foreground tabular-nums hidden sm:block">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Play/Pause */}
          <Button
            size="icon"
            variant="ghost"
            onClick={togglePlay}
            className="h-9 w-9 rounded-full"
          >
            {isPlaying
              ? <Pause className="h-4 w-4" />
              : <Play className="h-4 w-4 ml-0.5" />}
          </Button>

          {/* Kapat */}
          <Button
            size="icon"
            variant="ghost"
            onClick={stop}
            className={cn("h-7 w-7 text-muted-foreground hover:text-foreground")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
