import Link from "next/link";
import {
  Upload,
  Cpu,
  Headphones,
  BookOpen,
  Zap,
  Shield,
  ArrowRight,
  Check,
  FileText,
  Mic,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/ui/hero-section";
import { ShaderCard } from "@/components/ui/shader-card";

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

// ──────── Fiyatlandırma ────────

const PLANS = [
  {
    name: "Ücretsiz",
    price: "₺0",
    period: "/ ay",
    highlight: false,
    features: [
      "Sınırsız not yükleme",
      "OCR & metin analizi",
      "Ayda 3 podcast",
      "2 ses seçeneği",
      "Eğitici stil",
    ],
    cta: "Ücretsiz Başla",
    href: "/register",
  },
  {
    name: "Premium",
    price: "₺99",
    period: "/ ay",
    highlight: true,
    features: [
      "Sınırsız not yükleme",
      "OCR & metin analizi",
      "Sınırsız podcast",
      "Tüm ses seçenekleri",
      "3 podcast stili",
      "Hız kontrolü",
      "20MB dosya boyutu",
      "Öncelikli işlem",
      "Podcast indirme",
    ],
    cta: "Premium'u Dene",
    href: "/register",
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
      <section className="relative py-24 lg:py-32" id="pricing">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="mx-auto max-w-[580px] text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#00c3ff]">
              Fiyatlandırma
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl">
              Basit ve şeffaf fiyatlar
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Başlamak için kredi kartı gerekmez
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-[800px] gap-8 sm:grid-cols-2 lg:mt-20">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative overflow-hidden rounded-2xl border p-8 transition-all duration-300 ${
                  plan.highlight
                    ? "border-[#00c3ff]/40 bg-card shadow-xl shadow-[#00c3ff]/10"
                    : "bg-card hover:border-[#00c3ff]/20 hover:shadow-lg hover:shadow-[#00c3ff]/5"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00c3ff] to-[#f3a6ff]" />
                )}
                {plan.highlight && (
                  <span className="mb-4 inline-block rounded-full bg-[#00c3ff]/10 px-3 py-1 text-xs font-bold text-[#00c3ff]">
                    Önerilen
                  </span>
                )}
                <p className="text-lg font-bold">{plan.name}</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                  <span className="mb-1 text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[15px]">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#00c3ff]/10">
                        <Check className="h-3 w-3 text-[#00c3ff]" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className={`mt-8 w-full rounded-full text-base font-semibold ${
                    plan.highlight
                      ? "bg-[#00c3ff] text-white shadow-lg shadow-[#00c3ff]/25 hover:bg-[#00b0e6]"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                  size="lg"
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

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
          <Button
            asChild
            size="lg"
            className="mt-10 h-12 rounded-full bg-[#00c3ff] px-8 text-base font-semibold text-white shadow-lg shadow-[#00c3ff]/25 hover:bg-[#00b0e6] hover:shadow-xl hover:shadow-[#00c3ff]/30"
          >
            <Link href="/register">
              Ücretsiz Hesap Oluştur
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
