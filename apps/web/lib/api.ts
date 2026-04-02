/**
 * API client — Axios instance
 * Auth token yönetimi ve otomatik token yenileme
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 30000,
});

// ──────── Request Interceptor ────────
// Access token'ı her isteğe ekle
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      // Store'dan token'ı al (circular import önlemek için dinamik import yerine localStorage)
      const stored = localStorage.getItem("notcast-auth-token");
      if (stored && config.headers) {
        config.headers["Authorization"] = `Bearer ${stored}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ──────── Response Interceptor ────────
// 401 hatası → refresh token ile yenile → isteği tekrar gönder
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Refresh token endpoint'i döngüye girmesin
    const isRefreshEndpoint = originalRequest.url?.includes("/auth/refresh");
    if (error.response?.status !== 401 || originalRequest._retry || isRefreshEndpoint) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers["Authorization"] = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const storedRefreshToken = localStorage.getItem("notcast-refresh-token");
      if (!storedRefreshToken) {
        throw new Error("No refresh token");
      }

      const { data } = await apiClient.post<{
        success: boolean;
        data: { accessToken: string; refreshToken?: string };
      }>("/auth/refresh", { refreshToken: storedRefreshToken });

      const newToken = data.data.accessToken;
      localStorage.setItem("notcast-auth-token", newToken);
      // Refresh token rotation: yeni token gelirse kaydet
      if (data.data.refreshToken) {
        localStorage.setItem("notcast-refresh-token", data.data.refreshToken);
      }

      if (originalRequest.headers) {
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
      }

      processQueue(null, newToken);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem("notcast-auth-token");
      localStorage.removeItem("notcast-refresh-token");
      // Auth store'u temizle
      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
