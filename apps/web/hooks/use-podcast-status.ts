"use client";

/**
 * Podcast oluşturma durumunu WebSocket ile gerçek zamanlı takip eder
 */

import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket, connectSocket } from "@/lib/socket";
import { WS_EVENTS } from "@notcast/shared";
import type { PodcastStatus, PodcastProgress } from "@notcast/shared";
import { useAuthStore } from "@/stores/auth.store";

interface PodcastStatusState {
  status: PodcastStatus | null;
  progress: number;
  message: string;
  audioUrl: string | null;
}

export function usePodcastStatus(podcastId: string | null) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [state, setState] = useState<PodcastStatusState>({
    status: null,
    progress: 0,
    message: "",
    audioUrl: null,
  });

  const handleProgress = useCallback(
    (data: PodcastProgress) => {
      if (data.podcastId !== podcastId) return;
      setState((prev) => ({ ...prev, status: data.status, progress: data.progress, message: data.message }));
    },
    [podcastId]
  );

  const handleComplete = useCallback(
    (data: PodcastProgress & { audioUrl?: string }) => {
      if (data.podcastId !== podcastId) return;
      setState({ status: data.status, progress: 100, message: data.message, audioUrl: data.audioUrl ?? null });
      void queryClient.invalidateQueries({ queryKey: ["podcast", podcastId] });
      void queryClient.invalidateQueries({ queryKey: ["podcasts"] });
    },
    [podcastId, queryClient]
  );

  const handleError = useCallback(
    (data: PodcastProgress) => {
      if (data.podcastId !== podcastId) return;
      setState((prev) => ({ ...prev, status: "ERROR", progress: 0, message: data.message }));
      void queryClient.invalidateQueries({ queryKey: ["podcast", podcastId] });
    },
    [podcastId, queryClient]
  );

  useEffect(() => {
    if (!podcastId) return;

    connectSocket(user?.id);
    const socket = getSocket();

    socket.emit(WS_EVENTS.SUBSCRIBE_PODCAST, podcastId);
    socket.on(WS_EVENTS.PODCAST_GENERATION_PROGRESS, handleProgress);
    socket.on(WS_EVENTS.PODCAST_GENERATION_COMPLETE, handleComplete);
    socket.on(WS_EVENTS.PODCAST_GENERATION_ERROR, handleError);

    return () => {
      socket.off(WS_EVENTS.PODCAST_GENERATION_PROGRESS, handleProgress);
      socket.off(WS_EVENTS.PODCAST_GENERATION_COMPLETE, handleComplete);
      socket.off(WS_EVENTS.PODCAST_GENERATION_ERROR, handleError);
    };
  }, [podcastId, user?.id, handleProgress, handleComplete, handleError]);

  return state;
}
