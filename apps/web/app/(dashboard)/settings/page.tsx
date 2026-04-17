"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Lock,
  Mic2,
  Loader2,
  CheckCircle,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import apiClient from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth.store";
import type { Voice, ApiSuccessResponse } from "@notcast/shared";

// ──────── Şemalar ────────

const profileSchema = z.object({
  name: z.string().min(2, "En az 2 karakter"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
    newPassword: z
      .string()
      .min(8, "En az 8 karakter")
      .regex(/[A-Z]/, "Büyük harf içermeli")
      .regex(/[0-9]/, "Rakam içermeli"),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmNewPassword"],
  });

type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

// ──────── Ana Sayfa ────────

export default function SettingsPage() {
  const { user, refreshUser } = useAuthStore();
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    user?.preferredVoiceId ?? ""
  );

  const { data: voices } = useQuery({
    queryKey: ["voices"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiSuccessResponse<Voice[]>>("/voices");
      return data.data;
    },
  });

  // ── Profil formu ──
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isSubmitting: profileSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? "" },
  });

  const onProfileSubmit = async (data: ProfileInput) => {
    try {
      await apiClient.patch("/users/profile", data);
      await refreshUser();
      toast.success("Profil güncellendi");
    } catch {
      toast.error("Profil güncellenemedi");
    }
  };

  // ── Şifre formu ──
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: passwordSubmitting },
  } = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordInput) => {
    try {
      await apiClient.patch("/users/password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPassword();
      toast.success("Şifre değiştirildi");
    } catch {
      toast.error("Şifre değiştirilemedi — mevcut şifrenizi kontrol edin");
    }
  };

  // ── Ses tercihi ──
  const handleSaveVoice = async () => {
    try {
      await apiClient.patch("/users/preferences", {
        preferredVoiceId: selectedVoiceId || null,
      });
      await refreshUser();
      toast.success("Ses tercihi kaydedildi");
    } catch {
      toast.error("Tercih kaydedilemedi");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ayarlar</h1>
        <p className="text-sm text-muted-foreground mt-1">Hesap ve tercihlerinizi yönetin</p>
      </div>

      {/* Plan Bilgisi */}
      <Card className={user?.role === "PREMIUM" ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20" : ""}>
        <CardContent className="p-5 flex items-center gap-4">
          <Crown className={`h-6 w-6 flex-shrink-0 ${user?.role === "PREMIUM" ? "text-yellow-600" : "text-muted-foreground"}`} />
          <div className="flex-1 min-w-0">
            <p className="font-medium">
              {user?.role === "PREMIUM" ? "Premium Üye" : user?.role === "ADMIN" ? "Admin" : "Ücretsiz Plan"}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.role === "FREE"
                ? `Bu ay ${user.creditsUsed}/${user.monthlyCredits} podcast oluşturuldu`
                : "Sınırsız podcast oluşturabilirsiniz"}
            </p>
          </div>
          {user?.role === "FREE" && (
            <Button size="sm" variant="outline" onClick={() => window.location.href = "/pricing"}>
              Premium'a Geç
            </Button>
          )}
          {user?.role === "PREMIUM" && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const { data } = await apiClient.post<{ success: boolean; data: { url: string } }>("/payments/portal");
                  window.location.href = data.data.url;
                } catch {
                  toast.error("Portal açılamadı");
                }
              }}
            >
              Aboneliği Yönet
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Profil */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Profil Bilgileri
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" value={user?.email ?? ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Ad Soyad</Label>
              <Input id="name" {...registerProfile("name")} />
              {profileErrors.name && (
                <p className="text-xs text-destructive">{profileErrors.name.message}</p>
              )}
            </div>
            <Button type="submit" disabled={profileSubmitting}>
              {profileSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Şifre */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" /> Şifre Değiştir
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Mevcut Şifre</Label>
              <Input
                id="currentPassword"
                type="password"
                {...registerPassword("currentPassword")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Yeni Şifre</Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword("newPassword")}
              />
              {passwordErrors.newPassword && (
                <p className="text-xs text-destructive">{passwordErrors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmNewPassword">Yeni Şifre Tekrar</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                {...registerPassword("confirmNewPassword")}
              />
              {passwordErrors.confirmNewPassword && (
                <p className="text-xs text-destructive">{passwordErrors.confirmNewPassword.message}</p>
              )}
            </div>
            <Button type="submit" disabled={passwordSubmitting}>
              {passwordSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Şifreyi Değiştir
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Varsayılan Ses */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Mic2 className="h-4 w-4" /> Varsayılan Ses
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Podcast oluştururken varsayılan olarak kullanılacak ses.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedVoiceId("")}
              className={`w-full text-left p-3 rounded-lg border text-sm transition-colors ${
                selectedVoiceId === ""
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              Seçilmedi (her seferinde sor)
            </button>
            {voices?.map((voice) => (
              <button
                key={voice.id}
                onClick={() => setSelectedVoiceId(voice.id)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedVoiceId === voice.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{voice.name}</p>
                    {voice.description && (
                      <p className="text-xs text-muted-foreground">{voice.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {voice.gender === "male" ? "Erkek" : "Kadın"}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <Button onClick={handleSaveVoice}>
            <CheckCircle className="h-4 w-4" /> Tercihi Kaydet
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
