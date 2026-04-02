"use client";

/**
 * Upload hook — dosya yükleme state yönetimi ve API iletişimi
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import type { Note } from "@notcast/shared";
import type { AxiosError, AxiosProgressEvent } from "axios";

export type UploadMode = "file" | "text";

export interface UploadState {
  mode: UploadMode;
  file: File | null;
  previewUrl: string | null;
  text: string;
  title: string;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  error: string | null;
  createdNote: Note | null;
}

const INITIAL_STATE: UploadState = {
  mode: "file",
  file: null,
  previewUrl: null,
  text: "",
  title: "",
  progress: 0,
  status: "idle",
  error: null,
  createdNote: null,
};

export function useUpload() {
  const [state, setState] = useState<UploadState>(INITIAL_STATE);

  const setMode = useCallback((mode: UploadMode) => {
    setState((s) => ({ ...s, mode, file: null, previewUrl: null, text: "", error: null }));
  }, []);

  const setFile = useCallback((file: File | null) => {
    if (!file) {
      setState((s) => ({ ...s, file: null, previewUrl: null }));
      return;
    }

    // Önizleme URL'si oluştur (görseller için)
    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    setState((s) => ({
      ...s,
      file,
      previewUrl,
      title: s.title || file.name.replace(/\.[^.]+$/, ""),
      error: null,
    }));
  }, []);

  const setText = useCallback((text: string) => {
    setState((s) => ({ ...s, text, error: null }));
  }, []);

  const setTitle = useCallback((title: string) => {
    setState((s) => ({ ...s, title }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => {
      if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
      return INITIAL_STATE;
    });
  }, []);

  const upload = useCallback(async () => {
    const { mode, file, text, title } = state;

    if (mode === "file" && !file) {
      setState((s) => ({ ...s, error: "Lütfen bir dosya seçin" }));
      return;
    }
    if (mode === "text" && !text.trim()) {
      setState((s) => ({ ...s, error: "Lütfen metin girin" }));
      return;
    }

    setState((s) => ({ ...s, status: "uploading", progress: 0, error: null }));

    try {
      const formData = new FormData();

      if (mode === "file" && file) {
        formData.append("file", file);
      } else {
        formData.append("text", text);
      }

      if (title.trim()) {
        formData.append("title", title.trim());
      }

      const { data } = await apiClient.post<{ success: boolean; data: { note: Note } }>(
        "/notes/upload",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (event: AxiosProgressEvent) => {
            if (event.total) {
              const pct = Math.round((event.loaded / event.total) * 90); // 90%'a kadar upload
              setState((s) => ({ ...s, progress: pct }));
            }
          },
        }
      );

      setState((s) => ({
        ...s,
        status: "success",
        progress: 100,
        createdNote: data.data.note,
      }));

      toast.success("Not başarıyla yüklendi! İşleniyor...");
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      const errorMsg =
        axiosErr.response?.data?.error?.message ?? "Yükleme sırasında hata oluştu";

      setState((s) => ({ ...s, status: "error", error: errorMsg, progress: 0 }));
      toast.error(errorMsg);
    }
  }, [state]);

  return { state, setMode, setFile, setText, setTitle, reset, upload };
}
