"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  useInView,
  useSpring,
} from "framer-motion";
import { Check, Sparkles as SparklesIcon, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/* ── Sparkle Particle ── */

interface SparkleProps {
  x: number;
  y: number;
  size: number;
  delay: number;
}

const Sparkle: React.FC<SparkleProps> = ({ x, y, size, delay }) => (
  <motion.div
    className="absolute rounded-full bg-[#00c3ff]"
    style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
    transition={{ duration: 2, repeat: Infinity, delay, ease: "easeInOut" }}
  />
);

const Sparkles: React.FC<{ className?: string }> = ({ className = "" }) => {
  const sparkles = useRef(
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
    }))
  ).current;

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {sparkles.map((s, i) => (
        <Sparkle key={i} {...s} />
      ))}
    </div>
  );
};

/* ── Animated Number ── */

interface NumberFlowProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const NumberFlow: React.FC<NumberFlowProps> = ({
  value,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const [display, setDisplay] = useState(value);
  const spring = useSpring(value, { stiffness: 100, damping: 30, mass: 1 });

  useEffect(() => {
    spring.set(value);
    const unsub = spring.on("change", (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [value, spring]);

  return (
    <span className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
};

/* ── Scroll‑triggered Blur Reveal ── */

interface TimelineContentProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const TimelineContent: React.FC<TimelineContentProps> = ({
  children,
  delay = 0,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: "blur(10px)", y: 50 }}
      animate={
        isInView
          ? { opacity: 1, filter: "blur(0px)", y: 0 }
          : { opacity: 0, filter: "blur(10px)", y: 50 }
      }
      transition={{ duration: 0.8, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ── Vertical Cut Reveal ── */

const VerticalCutReveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={
          isInView
            ? { clipPath: "inset(0 0 0% 0)" }
            : { clipPath: "inset(0 0 100% 0)" }
        }
        transition={{ duration: 0.8, delay, ease: [0.65, 0, 0.35, 1] }}
      >
        {children}
      </motion.div>
    </div>
  );
};

/* ── Plan Data ── */

interface PricingPlan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  popular?: boolean;
  cta: string;
  badge?: string;
  strikePrice?: number;
}

const plans: PricingPlan[] = [
  {
    name: "Ücretsiz",
    description: "Hemen başla, ayda 3 podcast oluştur",
    monthlyPrice: 0,
    yearlyPrice: 0,
    cta: "Ücretsiz Başla",
    badge: "Başlangıç",
    features: [
      "Sınırsız not yükleme",
      "OCR & metin analizi",
      "Ayda 3 podcast",
      "2 ses seçeneği",
      "Sadece educational stil",
      "5MB dosya limiti",
    ],
  },
  {
    name: "Premium",
    description: "Sınırsız podcast, tüm özellikler açık",
    monthlyPrice: 99,
    yearlyPrice: 948,
    popular: true,
    cta: "Premium'u Dene",
    badge: "En Popüler",
    strikePrice: 149,
    features: [
      "Sınırsız podcast oluşturma",
      "Tüm ses seçenekleri & 3 stil",
      "Hız kontrolü & indirme",
      "20MB dosya limiti",
      "Öncelikli işlem kuyruğu",
      "Gelişmiş analiz raporları",
    ],
  },
];

/* ── Pricing Section ── */

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/40 py-24 px-4 lg:py-32"
      id="pricing"
    >
      {/* Sparkles */}
      <Sparkles className="opacity-30" />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Header */}
        <VerticalCutReveal className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00c3ff]/20 bg-[#00c3ff]/[0.08] px-4 py-1.5 text-sm font-semibold text-[#00c3ff] mb-6">
            <SparklesIcon className="h-3.5 w-3.5" />
            Fiyatlandırma
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight lg:text-5xl">
            Basit ve şeffaf fiyatlar
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Başlamak için kredi kartı gerekmez. Ücretsiz plan ile hemen dene,
            ihtiyacın olursa Premium&apos;a geç.
          </p>
        </VerticalCutReveal>

        {/* Toggle */}
        <TimelineContent delay={0.2} className="flex justify-center mb-14">
          <div className="flex items-center gap-4 rounded-full border bg-card p-2 shadow-lg">
            <span
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                !isYearly ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Aylık
            </span>
            <motion.button
              onClick={() => setIsYearly(!isYearly)}
              className="relative h-7 w-14 rounded-full bg-muted focus:outline-none focus:ring-2 focus:ring-[#00c3ff] focus:ring-offset-2"
              animate={{ backgroundColor: isYearly ? "#00c3ff" : undefined }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <motion.div
                className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md"
                animate={{ x: isYearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </motion.button>
            <span
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                isYearly ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Yıllık
              <span className="ml-2 text-xs font-semibold text-[#00c3ff]">
                20% tasarruf
              </span>
            </span>
          </div>
        </TimelineContent>

        {/* Cards */}
        <div className="grid gap-8 md:grid-cols-2 max-w-3xl mx-auto">
          {plans.map((plan, index) => (
            <TimelineContent key={plan.name} delay={0.3 + index * 0.15}>
              <Card
                className={`relative p-8 bg-gradient-to-b from-card to-card/50 border-border backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] ${
                  plan.popular
                    ? "shadow-[0_0_60px_rgba(0,195,255,0.25)] border-[#00c3ff]/40"
                    : "shadow-lg hover:shadow-xl"
                }`}
              >
                {/* Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#00c3ff] px-4 py-1 text-sm font-semibold text-white shadow-lg">
                    {plan.badge}
                  </div>
                )}

                {/* Plan info */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    {!plan.popular && plan.badge && (
                      <span className="rounded-md border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    {plan.strikePrice && (
                      <span className="mr-2 text-lg text-muted-foreground line-through">
                        ₺{isYearly ? plan.strikePrice * 12 : plan.strikePrice}
                      </span>
                    )}
                    <span className="text-5xl font-extrabold tracking-tighter">
                      ₺
                    </span>
                    <NumberFlow
                      value={
                        isYearly
                          ? plan.yearlyPrice
                          : plan.monthlyPrice
                      }
                      className="text-5xl font-extrabold tracking-tighter"
                    />
                    <span className="mb-1 ml-1 text-muted-foreground">
                      / {isYearly ? "yıl" : "ay"}
                    </span>
                  </div>
                  {isYearly && plan.monthlyPrice > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Aylık ₺{Math.round(plan.yearlyPrice / 12)} olarak
                      faturalandırılır
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  className={`w-full mb-8 h-11 text-base font-semibold ${
                    plan.popular
                      ? "bg-[#00c3ff] hover:bg-[#00b0e6] text-white shadow-lg shadow-[#00c3ff]/25"
                      : ""
                  }`}
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link href="/register">{plan.cta}</Link>
                </Button>

                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          plan.popular
                            ? "bg-[#00c3ff]/15"
                            : "bg-foreground/10"
                        }`}
                      >
                        <Check
                          className={`h-3 w-3 ${
                            plan.popular
                              ? "text-[#00c3ff]"
                              : "text-foreground"
                          }`}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </TimelineContent>
          ))}
        </div>

        {/* Bottom note */}
        <TimelineContent delay={0.7} className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            Tüm özelliklere erişim, gizli ücret yok
          </div>
        </TimelineContent>
      </div>
    </section>
  );
}
