"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, Headphones, Zap, ArrowRight } from "lucide-react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const menuItems = [
  { name: "Özellikler", href: "#features" },
  { name: "Nasıl Çalışır", href: "#how-it-works" },
  { name: "Fiyatlandırma", href: "#pricing" },
];

const NotCastLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-emerald-500 shadow-md shadow-violet-500/20">
        <Headphones className="h-4 w-4 text-white" />
      </div>
      <span className="text-lg font-bold tracking-tight">
        Not<span className="bg-gradient-to-r from-violet-500 to-emerald-400 bg-clip-text text-transparent">Cast</span>
      </span>
    </div>
  );
};

export const HeroSection = () => {
  const [menuState, setMenuState] = React.useState(false);

  return (
    <div>
      <header>
        <nav
          data-state={menuState ? "active" : undefined}
          className="group fixed z-20 w-full border-b border-dashed bg-white backdrop-blur md:relative dark:bg-zinc-950/50 lg:dark:bg-transparent"
        >
          <div className="m-auto max-w-5xl px-6">
            <div className="flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
              <div className="flex w-full justify-between lg:w-auto">
                <Link href="/" aria-label="home" className="flex items-center space-x-2">
                  <NotCastLogo />
                </Link>

                <button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState ? "Menüyü Kapat" : "Menüyü Aç"}
                  className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
                >
                  <Menu className="m-auto size-6 duration-200 group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
                  <X className="absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
                </button>
              </div>

              <div className="bg-background mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 group-data-[state=active]:block md:flex-nowrap lg:group-data-[state=active]:flex lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                <div className="lg:pr-4">
                  <ul className="space-y-6 text-base lg:flex lg:gap-8 lg:space-y-0 lg:text-sm">
                    {menuItems.map((item, index) => (
                      <li key={index}>
                        <a
                          href={item.href}
                          className="text-muted-foreground hover:text-accent-foreground block duration-150"
                        >
                          <span>{item.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:border-l lg:pl-6">
                  <ThemeToggle />
                  <Button asChild variant="outline" size="sm">
                    <Link href="/login">
                      <span>Giriş Yap</span>
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">
                      <span>Ücretsiz Başla</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Subtle radial light effects */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[2] isolate hidden opacity-50 contain-strict lg:block"
        >
          <div className="absolute left-0 top-0 h-[80rem] w-[35rem] -translate-y-[350px] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(260,80%,75%,.08)_0,hsla(260,60%,55%,.02)_50%,hsla(260,40%,45%,0)_80%)]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(160,70%,65%,.06)_0,hsla(160,50%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
          <div className="absolute left-0 top-0 h-[80rem] w-56 -translate-y-[350px] -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(260,70%,75%,.04)_0,hsla(260,50%,45%,.02)_80%,transparent_100%)]" />
        </div>

        <section className="overflow-hidden bg-white dark:bg-transparent">
          <div className="relative mx-auto max-w-5xl px-6 py-28 lg:py-24">
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <Zap className="h-3.5 w-3.5" /> Yapay Zeka Destekli Öğrenme Aracı
              </div>
              <h1 className="text-balance text-4xl font-semibold md:text-5xl lg:text-6xl">
                Ders notlarını{" "}
                <span className="bg-gradient-to-r from-violet-500 to-emerald-400 bg-clip-text text-transparent">
                  podcast&apos;e
                </span>{" "}
                dönüştür
              </h1>
              <p className="mx-auto my-8 max-w-2xl text-xl text-muted-foreground">
                Fotoğraf çek, PDF yükle ya da metni yapıştır — yapay zeka saniyeler içinde analiz eder ve gerçekçi Türkçe sesle dinleyebileceğin bir podcast oluşturur.
              </p>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">
                    <span>Ücretsiz Başla</span>
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">
                    <span>Giriş Yap</span>
                  </Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Kredi kartı gerekmez · Ayda 3 podcast ücretsiz
              </p>
            </div>
          </div>

          {/* 3D perspective app preview */}
          <div className="mx-auto -mt-16 max-w-7xl [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]">
            <div className="-mr-16 pl-16 [mask-image:linear-gradient(to_right,black_50%,transparent_100%)] [perspective:1200px] lg:-mr-56 lg:pl-56">
              <div className="[transform:rotateX(20deg)]">
                <div className="relative skew-x-[.36rad] lg:h-[44rem]">
                  <img
                    className="rounded-[--radius] relative z-[2] border dark:hidden"
                    src="https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=2880&q=80&auto=format&fit=crop"
                    alt="NotCast uygulama önizlemesi"
                    width={2880}
                    height={2074}
                  />
                  <img
                    className="rounded-[--radius] relative z-[2] hidden border dark:block"
                    src="https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=2880&q=80&auto=format&fit=crop"
                    alt="NotCast uygulama önizlemesi"
                    width={2880}
                    height={2074}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
