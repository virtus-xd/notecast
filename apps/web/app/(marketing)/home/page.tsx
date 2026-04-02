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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/shared/theme-toggle";

// ──────── Nasıl Çalışır Adımları ────────

const HOW_IT_WORKS = [
  {
    step: "1",
    icon: Upload,
    title: "Notunu Yükle",
    description: "Fotoğraf çek, PDF yükle ya da metni yapıştır. El yazısı bile çalışır.",
  },
  {
    step: "2",
    icon: Cpu,
    title: "Yapay Zeka Analiz Eder",
    description: "OCR + Claude API ile metin çıkarılır, başlıklara ayrılır, etiketlenir.",
  },
  {
    step: "3",
    icon: Headphones,
    title: "Podcast'ini Dinle",
    description: "Gerçekçi Türkçe sesle otomatik podcast oluşturulur, istediğin zaman dinle.",
  },
] as const;

// ──────── Özellikler ────────

const FEATURES = [
  { icon: BookOpen, title: "El Yazısı Desteği", description: "Google Cloud Vision ile karmaşık el yazılarını bile okur." },
  { icon: Cpu, title: "Akıllı Düzenleme", description: "Claude API OCR hatalarını düzeltir, metni bölümlere ayırır." },
  { icon: Headphones, title: "Gerçekçi Türkçe Ses", description: "ElevenLabs Multilingual v2 ile doğal tonlama." },
  { icon: Zap, title: "Hızlı İşlem", description: "Ortalama 1–2 dakikada podcast hazır." },
  { icon: Shield, title: "Güvenli Depolama", description: "Tüm dosyalar şifrelenmiş S3 üzerinde saklanır." },
  { icon: Upload, title: "Birden Fazla Format", description: "JPG, PNG, PDF, TXT ve DOCX desteği." },
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
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-black">N</span>
            </div>
            <span className="font-bold text-primary">NotCast</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild size="sm">
              <Link href="/login">Giriş Yap</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Ücretsiz Başla</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 max-w-5xl pt-24 pb-16 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Zap className="h-3.5 w-3.5" /> Yapay Zeka Destekli Öğrenme Aracı
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
          Ders notlarını{" "}
          <span className="text-primary">podcast'e</span>{" "}
          dönüştür
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Fotoğraf çek, PDF yükle ya da metni yapıştır — yapay zeka saniyeler içinde analiz eder ve
          gerçekçi Türkçe sesle dinleyebileceğin bir podcast oluşturur.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button size="lg" asChild>
            <Link href="/register">
              Ücretsiz Başla <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Giriş Yap</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Kredi kartı gerekmez · Ayda 3 podcast ücretsiz</p>
      </section>

      {/* Nasıl Çalışır */}
      <section className="bg-muted/40 py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Nasıl çalışır?</h2>
            <p className="text-muted-foreground mt-2">3 adımda notundan podcast'e</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, description }) => (
              <div key={step} className="relative">
                {/* Bağlantı çizgisi */}
                {step !== "3" && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%-1rem)] w-8 border-t-2 border-dashed border-primary/30 z-10" />
                )}
                <Card className="text-center h-full">
                  <CardContent className="p-6 space-y-4">
                    <div className="relative inline-flex">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                        <Icon className="h-7 w-7 text-primary" />
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {step}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-base">{title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Her şey düşünülmüş</h2>
            <p className="text-muted-foreground mt-2">Öğrenciler için tasarlandı</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex gap-4 p-4 rounded-xl border bg-card hover:border-primary/40 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fiyatlandırma */}
      <section className="bg-muted/40 py-20" id="pricing">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Fiyatlandırma</h2>
            <p className="text-muted-foreground mt-2">Başlamak için kredi kartı gerekmez</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlight ? "border-primary shadow-lg ring-1 ring-primary/20" : ""}
              >
                {plan.highlight && (
                  <div className="bg-primary text-primary-foreground text-xs font-semibold text-center py-1.5 rounded-t-lg">
                    Önerilen
                  </div>
                )}
                <CardContent className="p-6 space-y-5">
                  <div>
                    <p className="font-bold text-lg">{plan.name}</p>
                    <div className="flex items-end gap-1 mt-1">
                      <span className="text-3xl font-extrabold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm mb-0.5">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center space-y-5">
          <h2 className="text-3xl font-bold">Öğrenmeye bugün başla</h2>
          <p className="text-muted-foreground">
            Binlerce öğrenci NotCast ile çalışma saatlerini azalttı, anlama oranlarını artırdı.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">
              Ücretsiz Hesap Oluştur <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
              <span className="text-white text-[10px] font-black">N</span>
            </div>
            <span>NotCast © 2026</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Giriş</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Kayıt</Link>
            <Link href="#pricing" className="hover:text-foreground transition-colors">Fiyatlar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
