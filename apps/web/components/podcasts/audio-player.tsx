"use client";

/**
 * Audio Player — Wavesurfer.js dalga formu ile tam oynatıcı
 * Podcast detay sayfasında kullanılır.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { usePlayerStore, type PlayerTrack } from "@/stores/player.store";

// ──────── Hız Seçenekleri ────────

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ──────── Props ────────

interface AudioPlayerProps {
  track: PlayerTrack;
  className?: string;
}

// ──────── Bileşen ────────

export function AudioPlayer({ track, className }: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<import("wavesurfer.js").default | null>(null);
  const [wsReady, setWsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    speed,
    play,
    pause,
    setCurrentTime,
    setDuration,
    setVolume,
    setSpeed,
    setTrack,
    setMiniPlayer,
  } = usePlayerStore();

  // ── Wavesurfer başlat ──
  useEffect(() => {
    if (!waveformRef.current) return;

    let ws: import("wavesurfer.js").default;

    void (async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;

      ws = WaveSurfer.create({
        container: waveformRef.current!,
        waveColor: "hsl(var(--muted-foreground))",
        progressColor: "hsl(var(--primary))",
        cursorColor: "hsl(var(--primary))",
        height: 64,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        interact: true,
      });

      wavesurferRef.current = ws;

      ws.on("ready", () => {
        setDuration(ws.getDuration());
        setIsLoading(false);
        setWsReady(true);
        const state = usePlayerStore.getState();
        ws.setVolume(state.volume);
        ws.setPlaybackRate(state.speed);
        // Otomatik oynat (store'da isPlaying true ise)
        if (state.isPlaying) ws.play();
      });

      ws.on("audioprocess", () => {
        setCurrentTime(ws.getCurrentTime());
      });

      ws.on("seeking", () => {
        setCurrentTime(ws.getCurrentTime());
      });

      ws.on("finish", () => {
        pause();
        setCurrentTime(0);
      });

      await ws.load(track.streamUrl);
    })();

    return () => {
      ws?.destroy();
      wavesurferRef.current = null;
      setWsReady(false);
      setIsLoading(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track.streamUrl]);

  // ── Global store ile sync ──
  useEffect(() => {
    setTrack(track);
    setMiniPlayer(false);
    return () => setMiniPlayer(true);
  }, [track, setTrack, setMiniPlayer]);

  // ── Play/Pause sync ──
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !wsReady) return;
    if (isPlaying) {
      ws.play();
    } else {
      ws.pause();
    }
  }, [isPlaying, wsReady]);

  // ── Hız sync ──
  useEffect(() => {
    wavesurferRef.current?.setPlaybackRate(speed);
  }, [speed]);

  // ── Ses sync ──
  useEffect(() => {
    wavesurferRef.current?.setVolume(volume);
  }, [volume]);

  // ── Seek ──
  const handleSeek = useCallback(
    (values: number[]) => {
      const ws = wavesurferRef.current;
      if (!ws || !wsReady || !duration) return;
      const time = values[0] ?? 0;
      ws.seekTo(time / duration);
    },
    [wsReady, duration]
  );

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const skip = useCallback(
    (seconds: number) => {
      const ws = wavesurferRef.current;
      if (!ws || !wsReady) return;
      ws.seekTo(
        Math.min(Math.max((ws.getCurrentTime() + seconds) / ws.getDuration(), 0), 1)
      );
    },
    [wsReady]
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Dalga formu */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-md z-10">
            <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
        <div ref={waveformRef} className="w-full rounded-md overflow-hidden bg-muted/30" />
      </div>

      {/* Süre gösterimi */}
      <div className="flex justify-between text-xs text-muted-foreground px-0.5">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Seek slider */}
      <Slider
        min={0}
        max={duration || 1}
        step={0.1}
        value={[currentTime]}
        onValueChange={handleSeek}
        disabled={!wsReady}
        className="w-full"
      />

      {/* Kontroller */}
      <div className="flex items-center justify-between">
        {/* Sol: Hız */}
        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                speed === s
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Orta: Play kontrolleri */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => skip(-10)} disabled={!wsReady}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={togglePlay}
            disabled={!wsReady}
            className="h-10 w-10 rounded-full"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => skip(10)} disabled={!wsReady}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Sağ: Ses */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setVolume(volume === 0 ? 1 : 0)}
            className="h-7 w-7"
          >
            {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[volume]}
            onValueChange={([v]) => setVolume(v ?? 1)}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}
