"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { RegisterSchema, type RegisterInput } from "@notcast/shared";

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const password = watch("password", "");

  // Şifre gücü göstergesi
  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (!pwd) return { label: "", color: "", width: "0%" };
    if (pwd.length < 8) return { label: "Çok zayıf", color: "bg-destructive", width: "25%" };
    let strength = 0;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*]/.test(pwd)) strength++;
    if (pwd.length >= 12) strength++;
    if (strength <= 1) return { label: "Zayıf", color: "bg-orange-500", width: "40%" };
    if (strength === 2) return { label: "Orta", color: "bg-yellow-500", width: "65%" };
    if (strength === 3) return { label: "Güçlü", color: "bg-green-500", width: "85%" };
    return { label: "Çok güçlü", color: "bg-emerald-600", width: "100%" };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterInput) => {
    await registerUser(data.email, data.password, data.name);
  };

  return (
    <Card className="w-full shadow-lg border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center">Hesap Oluştur</CardTitle>
        <CardDescription className="text-center">
          Ücretsiz başla — 3 podcast/ay hediye
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* İsim */}
          <div className="space-y-2">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              type="text"
              placeholder="Adınız Soyadınız"
              autoComplete="name"
              disabled={isLoading}
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* E-posta */}
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

          {/* Şifre */}
          <div className="space-y-2">
            <Label htmlFor="password">Şifre</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="En az 8 karakter"
                autoComplete="new-password"
                disabled={isLoading}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Şifre gücü çubuğu */}
            {password && (
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{strength.label}</p>
              </div>
            )}
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          {/* Gönder */}
          <Button type="submit" className="w-full" disabled={isLoading} size="lg">
            {isLoading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Kayıt yapılıyor...</>
            ) : (
              <><UserPlus className="h-4 w-4" /> Ücretsiz Kayıt Ol</>
            )}
          </Button>
        </form>

        {/* Giriş linki */}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Zaten hesabınız var mı?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Giriş yapın
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
