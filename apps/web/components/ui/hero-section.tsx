"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Menu, X, Headphones, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const menuItems = [
  { name: "Özellikler", href: "#features" },
  { name: "Nasıl Çalışır", href: "#how-it-works" },
  { name: "Fiyatlandırma", href: "#pricing" },
];

const NotCastLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00c3ff] shadow-lg shadow-[#00c3ff]/20">
        <Headphones className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
      </div>
      <span className="text-xl font-extrabold tracking-tight text-foreground">
        Not<span className="text-[#00c3ff]">Cast</span>
      </span>
    </div>
  );
};

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl">
      <nav
        data-state={menuState ? "active" : undefined}
        className="group mx-auto max-w-[1200px] px-6"
      >
        <div className="flex h-[72px] items-center justify-between">
          {/* Logo */}
          <Link href="/" aria-label="home">
            <NotCastLogo />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 lg:flex">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="text-[15px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="text-[15px] font-medium">
              <Link href="/login">Giriş Yap</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-[#00c3ff] px-5 text-[15px] font-semibold text-white shadow-none hover:bg-[#00b0e6]"
            >
              <Link href="/register">Ücretsiz Başla</Link>
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMenuState(!menuState)}
            aria-label={menuState ? "Menüyü Kapat" : "Menüyü Aç"}
            className="relative z-20 flex h-10 w-10 items-center justify-center rounded-xl lg:hidden"
          >
            <Menu className="size-6 transition-all duration-200 group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
            <X className="absolute size-6 -rotate-180 scale-0 opacity-0 transition-all duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
          </button>
        </div>

        {/* Mobile menu */}
        <div className="hidden overflow-hidden rounded-2xl border bg-background p-6 shadow-xl group-data-[state=active]:block lg:!hidden">
          <ul className="space-y-4">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.href}
                  onClick={() => setMenuState(false)}
                  className="block text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.name}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 border-t pt-6">
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Giriş Yap</Link>
            </Button>
            <Button
              asChild
              className="w-full rounded-full bg-[#00c3ff] font-semibold text-white hover:bg-[#00b0e6]"
            >
              <Link href="/register">Ücretsiz Başla</Link>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export const HeroSection = () => {
  return (
    <>
      <HeroHeader />

      <AuroraBackground className="min-h-[auto] pb-20 pt-16 lg:pb-32 lg:pt-24">
        <div className="relative z-10 mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-[780px] text-center">
            {/* Badge */}
            <div className="animate-element mb-8 inline-flex items-center gap-2 rounded-full border border-[#00c3ff]/20 bg-[#00c3ff]/[0.08] px-4 py-1.5 text-sm font-semibold text-[#00c3ff] backdrop-blur-sm">
              <Headphones className="h-3.5 w-3.5" />
              Yapay Zeka Podcast Oluşturucu
            </div>

            {/* Headline */}
            <h1 className="animate-element animate-delay-100 text-[clamp(2.25rem,5vw,4rem)] font-extrabold leading-[1.1] tracking-tight dark:text-white">
              Ders notlarını{" "}
              <span className="text-[#00c3ff]">podcast&apos;e</span> dönüştür
            </h1>

            {/* Description */}
            <p className="animate-element animate-delay-200 mx-auto mt-6 max-w-[580px] text-lg leading-relaxed text-slate-600 dark:text-neutral-300">
              Fotoğraf çek, PDF yükle ya da metni yapıştır — yapay zeka saniyeler içinde analiz eder ve gerçekçi Türkçe sesle dinleyebileceğin bir podcast oluşturur.
            </p>

            {/* CTA */}
            <div className="animate-element animate-delay-300 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-[#00c3ff] px-8 text-base font-semibold text-white shadow-lg shadow-[#00c3ff]/25 hover:bg-[#00b0e6] hover:shadow-xl hover:shadow-[#00c3ff]/30"
              >
                <Link href="/register">
                  Ücretsiz Başla
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-slate-300 px-8 text-base font-semibold dark:border-zinc-700"
              >
                <Link href="/login">Giriş Yap</Link>
              </Button>
            </div>

            <p className="animate-element animate-delay-400 mt-5 text-sm text-slate-500 dark:text-neutral-400">
              Kredi kartı gerekmez · Ayda 3 podcast ücretsiz
            </p>
          </div>

          {/* Product screenshot */}
          <div className="animate-element animate-delay-500 relative mx-auto mt-16 max-w-[960px] lg:mt-20">
            <div className="overflow-hidden rounded-2xl border border-white/20 shadow-2xl shadow-black/10 dark:border-zinc-700/50 dark:shadow-black/30">
              <img
                src="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1920&q=80&auto=format&fit=crop"
                alt="NotCast uygulama önizlemesi"
                className="w-full"
                width={1920}
                height={1080}
              />
            </div>
          </div>
        </div>
      </AuroraBackground>
    </>
  );
};
