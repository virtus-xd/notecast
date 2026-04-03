"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { LoginSchema, type LoginInput } from "@notcast/shared";

/* ── Testimonial data ── */

interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Ayşe K.",
    handle: "Tıp Fakültesi",
    text: "Ders notlarımı podcast olarak dinlemek öğrenme hızımı inanılmaz artırdı.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Emre Y.",
    handle: "Bilgisayar Müh.",
    text: "Sınav dönemlerinde hayat kurtarıcı. Otobüste bile ders çalışabiliyorum.",
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/32.jpg",
    name: "Burak T.",
    handle: "Hukuk Fakültesi",
    text: "El yazısı notlarımı bile mükemmel okuyor. Türkçe ses kalitesi harika.",
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

/* ── Main login form ── */

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    await login(data.email, data.password);
  };

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-full bg-background text-foreground">
      {/* Sol kolon — Form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            {/* Logo (mobil) */}
            <Link href="/" className="animate-element animate-delay-100 flex items-center gap-2 md:hidden mb-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-black">N</span>
              </div>
              <span className="text-xl font-bold text-primary">NotCast</span>
            </Link>

            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">
              <span className="font-light tracking-tighter">Tekrar Hoş Geldin</span>
            </h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">
              Hesabına giriş yap ve notlarını dinlemeye devam et
            </p>

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* E-posta */}
              <div className="animate-element animate-delay-300">
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
              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-muted-foreground">Şifre</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Şifrenizi girin"
                      autoComplete="current-password"
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
                {errors.password && (
                  <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Beni hatırla + Şifremi unuttum */}
              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                  <span className="text-foreground/90">Beni hatırla</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="hover:underline text-primary transition-colors"
                >
                  Şifremi unuttum
                </Link>
              </div>

              {/* Gönder */}
              <button
                type="submit"
                disabled={isLoading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Giriş yapılıyor...
                  </span>
                ) : (
                  "Giriş Yap"
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

            {/* Google ile giriş — ileride aktif edilecek */}
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
              Google ile devam et
            </button>

            {/* Kayıt linki */}
            <p className="animate-element animate-delay-900 text-center text-sm text-muted-foreground">
              Hesabın yok mu?{" "}
              <Link href="/register" className="text-primary hover:underline transition-colors">
                Hesap Oluştur
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
              "url(https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1920&q=80)",
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
