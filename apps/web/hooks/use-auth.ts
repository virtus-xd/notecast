"use client";

/**
 * Auth hook — login/register/logout işlemleri için
 */

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import type { AxiosError } from "axios";

interface ApiError {
  error?: { message?: string };
}

function getErrorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<ApiError>;
  return (
    axiosErr.response?.data?.error?.message ??
    "Beklenmedik bir hata oluştu"
  );
}

export function useAuth() {
  const router = useRouter();
  const { login, register, logout, isLoading, user, isAuthenticated } = useAuthStore();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      toast.success("Giriş başarılı! Yönlendiriliyorsunuz...");
      router.push("/dashboard");
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const handleRegister = async (email: string, password: string, name: string) => {
    try {
      await register(email, password, name);
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
    // Kayıt başarılı — otomatik giriş yap
    try {
      await login(email, password);
      toast.success("Hesabınız oluşturuldu! Hoş geldiniz.");
      router.push("/dashboard");
    } catch {
      // Login otomatik başarısız olursa login sayfasına yönlendir
      toast.success("Kayıt başarılı! Giriş yapınız.");
      router.push("/login");
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.info("Çıkış yapıldı");
    router.push("/");
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };
}
