import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    template: "%s | NotCast",
    default: "Hesap | NotCast",
  },
};

/**
 * Auth sayfaları için paylaşılan layout
 * İki sütunlu: sol branding, sağ form
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Sol — Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-12 text-white relative overflow-hidden">
        {/* Arka plan deseni */}
        <div className="absolute inset-0 opacity-10">
          {/* Dalga benzeri SVG deseni */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 400 200" fill="none">
            <path d="M0 100 Q100 50 200 100 T400 100 V200 H0Z" fill="currentColor" />
          </svg>
          <svg className="absolute top-0 right-0 w-64 h-64" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="2" />
            <circle cx="100" cy="100" r="20" fill="currentColor" />
          </svg>
        </div>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-xl font-black">N</span>
          </div>
          <span className="text-2xl font-bold tracking-tight">NotCast</span>
        </Link>

        {/* Orta içerik */}
        <div className="space-y-6 relative z-10">
          <blockquote className="space-y-3">
            <p className="text-2xl font-semibold leading-relaxed">
              &ldquo;Ders notlarımı podcast formatında dinlemek
              öğrenme hızımı inanılmaz artırdı.&rdquo;
            </p>
            <footer className="text-brand-200">
              <strong>Ayşe K.</strong> · Tıp Fakültesi 3. Sınıf
            </footer>
          </blockquote>

          {/* Özellikler */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: "Not Yükleme", value: "Sınırsız" },
              { label: "Türkçe Sesler", value: "6 Ses" },
              { label: "OCR Desteği", value: "El Yazısı" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-lg font-bold">{value}</div>
                <div className="text-xs text-brand-200">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alt */}
        <p className="text-brand-300 text-sm relative z-10">
          © 2025 NotCast. Tüm hakları saklıdır.
        </p>
      </div>

      {/* Sağ — Form */}
      <div className="flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-gray-900">
        <div className="w-full max-w-md space-y-6">
          {/* Mobil logo */}
          <div className="flex justify-center lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-black">N</span>
              </div>
              <span className="text-xl font-bold text-primary">NotCast</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
