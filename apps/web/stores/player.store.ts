"use client";

/**
 * Global Audio Player Store
 * Sayfa geçişlerinde çalmaya devam eden mini player state'i
 */

import { create } from "zustand";

export interface PlayerTrack {
  podcastId: string;
  title: string;
  voiceName: string;
  subject: string | null;
  streamUrl: string;
}

interface PlayerState {
  track: PlayerTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  speed: number;
  isMiniPlayer: boolean; // true = mini player görünür (podcast detay sayfası dışında)

  // Actions
  setTrack: (track: PlayerTrack) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setSpeed: (speed: number) => void;
  setMiniPlayer: (mini: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()((set) => ({
  track: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  speed: 1,
  isMiniPlayer: false,

  setTrack: (track) =>
    set({ track, isPlaying: true, currentTime: 0, isMiniPlayer: false }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  stop: () => set({ isPlaying: false, currentTime: 0, track: null }),

  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setSpeed: (speed) => set({ speed }),
  setMiniPlayer: (mini) => set({ isMiniPlayer: mini }),
}));
