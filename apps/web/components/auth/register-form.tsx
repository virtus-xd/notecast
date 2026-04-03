"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { RegisterSchema, type RegisterInput } from "@notcast/shared";

/* ── Testimonial data ── */

interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/44.jpg",
    name: "Zeynep A.",
    handle: "Eczacılık",
    text: "Ücretsiz 3 podcast hakkıyla başladım, artık Premium kullanıyorum. Vazgeçilmez!",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/22.jpg",
    name: "Can D.",
    handle: "İşletme Fakültesi",
    text: "Kayıt olduktan 5 dakika sonra ilk podcast'imi oluşturdum. Süper kolay.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/68.jpg",
    name: "Elif S.",
    handle: "Psikoloji",
    text: "El yazısı notlarımı bile tanıyor. Türkçe seslendirme kalitesi beklentimin üstünde.",
  },
];

/* ── Glass input wrapper ── */

function GlassInputWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/70 focus-within:bg-primary/10">
      {children}
    </div>
  );
}

/* ── Testimonial card ── */

function TestimonialCard({ testimonial, delay }: { testimonial: Testimonial; delay: string }) {
  return (
    <div
      className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}
    >
      <img
        src={testimonial.avatarSrc}
        className="h-10 w-10 object-cover rounded-2xl"
        alt={testimonial.name}
      />
      <div className="text-sm leading-snug">
        <p className="flex items-center gap-1 font-medium text-white">{testimonial.name}</p>
        <p className="text-zinc-400">{testimonial.handle}</p>
        <p className="mt-1 text-white/80">{testimonial.text}</p>
      </div>
    </div>
  );
}

/* ── Password strength ── */

function getPasswordStrength(pwd: string): { label: string; color: string; width: string } {
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
}

/* ── Main register form ── */

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
  const strength = getPasswordStrength(password);

  const onSubmit = async (data: RegisterInput) => {
    await registerUser(data.email, data.password, data.name);
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-full bg-background text-foreground">
      {/* Sol kolon — Form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-5">
            {/* Logo (mobil) */}
            <Link href="/" className="animate-element animate-delay-100 flex items-center gap-2 md:hidden mb-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-black">N</span>
              </div>
              <span className="text-xl font-bold text-primary">NotCast</span>
            </Link>

            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              <span className="font-light tracking-tighter">Hesap Oluştur</span>
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              Ücretsiz başla — her ay 3 podcast hediye
            </p>

            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Ad Soyad */}
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-muted-foreground">Ad Soyad</label>
                <GlassInputWrapper>
                  <input
                    type="text"
                    placeholder="Adınız Soyadınız"
                    autoComplete="name"
                    disabled={isLoading}
                    aria-invalid={!!errors.name}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50"
                    {...register("name")}
                  />
                </GlassInputWrapper>
                {errors.name && (
                  <p className="text-xs text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>

              {/* E-posta */}
              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">E-posta Adresi</label>
                <GlassInputWrapper>
                  <input
                    type="email"
                    placeholder="ornek@email.com"
                    autoComplete="email"
                    disabled={isLoading}
                    aria-invalid={!!errors.email}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none disabled:opacity-50"
                    {...register("email")}
                  />
                </GlassInputWrapper>
                {errors.email && (
                  <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Şifre */}
              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-muted-foreground">Şifre</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="En az 8 karakter"
                      autoComplete="new-password"
                      disabled={isLoading}
                      aria-invalid={!!errors.password}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none disabled:opacity-50"
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center"
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
                {/* Şifre gücü çubuğu */}
                {password && (
                  <div className="space-y-1 mt-2">
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
                  <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Gönder */}
              <button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Kayıt yapılıyor...
                  </span>
                ) : (
                  "Ücretsiz Kayıt Ol"
                )}
              </button>
            </form>

            {/* Ayırıcı */}
            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-border" />
              <span className="px-4 text-sm text-muted-foreground bg-background absolute">
                veya
              </span>
            </div>

            {/* Google ile kayıt */}
            <button
              type="button"
              className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-4 hover:bg-secondary transition-colors"
              onClick={() => {}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C36.971 39.801 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
              </svg>
              Google ile kayıt ol
            </button>

            {/* Giriş linki */}
            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              Zaten hesabın var mı?{" "}
              <Link href="/login" className="text-primary hover:underline transition-colors">
                Giriş Yap
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Sağ kolon — Hero + Testimonials */}
      <section className="hidden md:block flex-1 relative p-4">
        <div
          className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1920&q=80)",
          }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Logo */}
          <div className="absolute top-8 left-8 z-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-lg font-black text-white">N</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">NotCast</span>
            </Link>
          </div>
        </div>

        {/* Testimonial kartları */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center z-10">
          {testimonials[0] && <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />}
          {testimonials[1] && (
            <div className="hidden xl:flex">
              <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
            </div>
          )}
          {testimonials[2] && (
            <div className="hidden 2xl:flex">
              <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
