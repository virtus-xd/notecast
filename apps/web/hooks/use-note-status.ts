"use client";

/**
 * Not işleme durumunu WebSocket ile gerçek zamanlı takip eder
 */

import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket, connectSocket } from "@/lib/socket";
import { WS_EVENTS } from "@notcast/shared";
import type { NoteStatus, ProcessingProgress } from "@notcast/shared";
import { useAuthStore } from "@/stores/auth.store";

interface NoteStatusState {
  status: NoteStatus | null;
  progress: number;
  message: string;
}

/**
 * Belirli bir not için WebSocket ile durum takibi
 */
export function useNoteStatus(noteId: string | null) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [state, setState] = useState<NoteStatusState>({
    status: null,
    progress: 0,
    message: "",
  });

  const handleProgress = useCallback(
    (data: ProcessingProgress) => {
      if (data.noteId !== noteId) return;
      setState({ status: data.status, progress: data.progress, message: data.message });
    },
    [noteId]
  );

  const handleComplete = useCallback(
    (data: ProcessingProgress) => {
      if (data.noteId !== noteId) return;
      setState({ status: data.status, progress: 100, message: data.message });
      // Not detay cache'ini güncelle
      void queryClient.invalidateQueries({ queryKey: ["note", noteId] });
      void queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
    [noteId, queryClient]
  );

  const handleError = useCallback(
    (data: ProcessingProgress) => {
      if (data.noteId !== noteId) return;
      setState({ status: "ERROR", progress: 0, message: data.message });
      void queryClient.invalidateQueries({ queryKey: ["note", noteId] });
    },
    [noteId, queryClient]
  );

  useEffect(() => {
    if (!noteId) return;

    connectSocket(user?.id);
    const socket = getSocket();

    // Nota özel odaya abone ol
    socket.emit(WS_EVENTS.SUBSCRIBE_NOTE, noteId);

    socket.on(WS_EVENTS.NOTE_PROCESSING_PROGRESS, handleProgress);
    socket.on(WS_EVENTS.NOTE_PROCESSING_COMPLETE, handleComplete);
    socket.on(WS_EVENTS.NOTE_PROCESSING_ERROR, handleError);

    return () => {
      socket.off(WS_EVENTS.NOTE_PROCESSING_PROGRESS, handleProgress);
      socket.off(WS_EVENTS.NOTE_PROCESSING_COMPLETE, handleComplete);
      socket.off(WS_EVENTS.NOTE_PROCESSING_ERROR, handleError);
    };
  }, [noteId, user?.id, handleProgress, handleComplete, handleError]);

  return state;
}
