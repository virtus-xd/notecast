import Link from "next/link";
import {
  Upload,
  Cpu,
  Headphones,
  BookOpen,
  Zap,
  Shield,
  ArrowRight,
  FileText,
  Mic,
  Sparkles,
} from "lucide-react";
import { HeroSection } from "@/components/ui/hero-section";
import { ShaderCard } from "@/components/ui/shader-card";
import { PricingSection } from "@/components/ui/pricing-card";
import { ShinyButton } from "@/components/ui/shiny-button";

// ──────── Nasıl Çalışır Adımları ────────

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Upload,
    title: "Notunu Yükle",
    description:
      "Fotoğraf çek, PDF yükle ya da metni yapıştır. El yazısı bile çalışır — Google Cloud Vision ile anında tanınır.",
    color: "#00c3ff",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Yapay Zeka Analiz Eder",
    description:
      "OCR ile metin çıkarılır, Claude API ile başlıklara ayrılır, etiketlenir ve podcast script'i oluşturulur.",
    color: "#f3a6ff",
  },
  {
    step: "03",
    icon: Headphones,
    title: "Podcast'ini Dinle",
    description:
      "ElevenLabs ile gerçekçi Türkçe sesle otomatik podcast oluşturulur. İstediğin zaman, istediğin yerde dinle.",
    color: "#35c838",
  },
] as const;

// ──────── Özellikler ────────

const FEATURES = [
  {
    icon: BookOpen,
    title: "El Yazısı Desteği",
    description: "Google Cloud Vision ile karmaşık el yazılarını bile yüksek doğrulukla okur.",
  },
  {
    icon: Cpu,
    title: "Akıllı Düzenleme",
    description: "Claude API, OCR hatalarını düzeltir ve metni anlamlı bölümlere ayırır.",
  },
  {
    icon: Mic,
    title: "Gerçekçi Türkçe Ses",
    description: "ElevenLabs Multilingual v2 ile doğal tonlama ve akıcı Türkçe seslendirme.",
  },
  {
    icon: Zap,
    title: "Hızlı İşlem",
    description: "Ortalama 1–2 dakikada notundan hazır bir podcast oluşturulur.",
  },
  {
    icon: Shield,
    title: "Güvenli Depolama",
    description: "Tüm dosyalar şifrelenmiş S3 üzerinde güvenle saklanır.",
  },
  {
    icon: FileText,
    title: "Birden Fazla Format",
    description: "JPG, PNG, PDF, TXT ve DOCX dosya formatlarını destekler.",
  },
] as const;


// ──────── Bileşen ────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero with integrated nav */}
      <HeroSection />

      {/* Nasıl Çalışır */}
      <section className="relative py-24 lg:py-32" id="how-it-works">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-[580px] text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#00c3ff]">
              Nasıl Çalışır
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
              3 adımda notundan podcast&apos;e
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Karmaşık süreçler yok. Yükle, bekle, dinle.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3 lg:mt-20">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }, index) => (
              <ShaderCard
                key={step}
                index={index}
                icon={<Icon className="h-12 w-12 text-white" />}
                title={title}
                description={description}
                stepLabel={step}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section className="relative bg-muted/40 py-24 lg:py-32" id="features">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-[580px] text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#00c3ff]">
              Özellikler
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
              Her şey düşünülmüş
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Öğrenciler için baştan sona tasarlandı
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description }, index) => (
              <ShaderCard
                key={title}
                index={index + 3}
                icon={<Icon className="h-12 w-12 text-white" />}
                title={title}
                description={description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Fiyatlandırma */}
      <PricingSection />

      {/* CTA — Dark section */}
      <section className="relative overflow-hidden bg-[#1a1a1a] py-24 dark:bg-muted/40 lg:py-32">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto h-[400px] w-[600px] -translate-y-1/2 rounded-full bg-[#00c3ff]/[0.08] blur-[120px]"
        />

        <div className="relative mx-auto max-w-[700px] px-6 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white dark:text-foreground lg:text-4xl">
            Öğrenmeye bugün başla
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-400 dark:text-muted-foreground">
            Binlerce öğrenci NotCast ile çalışma saatlerini azalttı, anlama oranlarını artırdı. Sen de katıl.
          </p>
          <Link href="/register" className="mt-10 inline-block">
            <ShinyButton>
              Ücretsiz Hesap Oluştur
              <ArrowRight className="ml-2 inline h-4 w-4" />
            </ShinyButton>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00c3ff]">
              <Headphones className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-muted-foreground">
              NotCast &copy; 2026
            </span>
          </div>
          <div className="flex gap-6 text-sm">
            <Link
              href="/login"
              className="font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Giriş
            </Link>
            <Link
              href="/register"
              className="font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Kayıt
            </Link>
            <a
              href="#pricing"
              className="font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Fiyatlar
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
