"use client";
import React from "react";
import { PlusIcon, ShieldCheckIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { BorderTrail } from "./border-trail";
import Link from "next/link";

export function PricingSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32" id="pricing">
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="mx-auto max-w-xl space-y-5"
        >
          <div className="flex justify-center">
            <div className="rounded-lg border px-4 py-1 font-mono text-sm">
              Fiyatlandırma
            </div>
          </div>
          <h2 className="mt-5 text-center text-2xl font-bold tracking-tighter md:text-3xl lg:text-4xl">
            Basit ve şeffaf fiyatlar
          </h2>
          <p className="text-muted-foreground mt-5 text-center text-sm md:text-base">
            Başlamak için kredi kartı gerekmez. Ücretsiz plan ile hemen dene,
            ihtiyacın olursa Premium&apos;a geç.
          </p>
        </motion.div>

        <div className="relative">
          {/* Grid background */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0 -z-10 size-full",
              "bg-[linear-gradient(to_right,hsl(var(--foreground)/.07)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/.07)_1px,transparent_1px)]",
              "bg-[size:32px_32px]",
              "[mask-image:radial-gradient(ellipse_at_center,hsl(var(--background))_10%,transparent)]"
            )}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            viewport={{ once: true }}
            className="mx-auto w-full max-w-2xl space-y-2"
          >
            <div className="relative grid border bg-background p-4 md:grid-cols-2">
              <PlusIcon className="absolute -left-3 -top-3 size-5.5" />
              <PlusIcon className="absolute -right-3 -top-3 size-5.5" />
              <PlusIcon className="absolute -bottom-3 -left-3 size-5.5" />
              <PlusIcon className="absolute -bottom-3 -right-3 size-5.5" />

              {/* Ücretsiz plan */}
              <div className="w-full px-4 pb-4 pt-5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold leading-none">Ücretsiz</h3>
                    <Badge variant="secondary">Başlangıç</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Hemen başla, ayda 3 podcast oluştur
                  </p>
                </div>
                <div className="mt-10 space-y-4">
                  <div className="text-muted-foreground flex items-end gap-0.5 text-xl">
                    <span className="text-foreground -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl">
                      ₺0
                    </span>
                    <span>/ ay</span>
                  </div>
                  <Button className="w-full" variant="outline" asChild>
                    <Link href="/register">Ücretsiz Başla</Link>
                  </Button>
                </div>

                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5 text-foreground" />
                    Sınırsız not yükleme
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5 text-foreground" />
                    OCR & metin analizi
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5 text-foreground" />
                    Ayda 3 podcast
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5 text-foreground" />
                    2 ses seçeneği
                  </li>
                </ul>
              </div>

              {/* Premium plan */}
              <div className="relative w-full rounded-lg border px-4 pb-4 pt-5">
                <BorderTrail
                  style={{
                    boxShadow:
                      "0px 0px 60px 30px rgb(0 195 255 / 50%), 0 0 100px 60px rgb(0 195 255 / 30%), 0 0 140px 90px rgb(0 195 255 / 10%)",
                  }}
                  size={100}
                />
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold leading-none">Premium</h3>
                    <div className="flex items-center gap-x-1">
                      <span className="text-muted-foreground text-sm line-through">
                        ₺149
                      </span>
                      <Badge>33% indirim</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    Sınırsız podcast, tüm özellikler
                  </p>
                </div>
                <div className="mt-10 space-y-4">
                  <div className="text-muted-foreground flex items-end gap-0.5 text-xl">
                    <span className="text-foreground -mb-0.5 text-4xl font-extrabold tracking-tighter md:text-5xl">
                      ₺99
                    </span>
                    <span>/ ay</span>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/register">Premium&apos;u Dene</Link>
                  </Button>
                </div>

                <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5 text-[#00c3ff]" />
                    Sınırsız podcast
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5 text-[#00c3ff]" />
                    Tüm ses seçenekleri & 3 stil
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5 text-[#00c3ff]" />
                    Hız kontrolü & indirme
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheckIcon className="size-3.5 text-[#00c3ff]" />
                    20MB dosya & öncelikli işlem
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-muted-foreground flex items-center justify-center gap-x-2 text-sm">
              <ShieldCheckIcon className="size-4" />
              <span>Tüm özelliklere erişim, gizli ücret yok</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
