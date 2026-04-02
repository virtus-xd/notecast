"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import apiClient from "@/lib/api";
import { ForgotPasswordSchema, type ForgotPasswordInput } from "@notcast/shared";
import type { AxiosError } from "axios";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", data);
      setSubmitted(true);
    } catch (err) {
      const axiosErr = err as AxiosError<{ error?: { message?: string } }>;
      toast.error(axiosErr.response?.data?.error?.message ?? "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">E-posta Gönderildi</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              <strong>{getValues("email")}</strong> adresine şifre sıfırlama bağlantısı
              gönderildi. Gelen kutunuzu kontrol edin.
            </p>
            <Button variant="outline" asChild className="mt-2">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Giriş sayfasına dön
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center">Şifremi Unuttum</CardTitle>
        <CardDescription className="text-center">
          E-posta adresinizi girin, sıfırlama bağlantısı gönderelim
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              type="email"
              placeholder="ornek@email.com"
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} size="lg">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor...</>
            ) : (
              <><Mail className="h-4 w-4" /> Sıfırlama Bağlantısı Gönder</>
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            <ArrowLeft className="h-3 w-3" /> Giriş sayfasına dön
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
