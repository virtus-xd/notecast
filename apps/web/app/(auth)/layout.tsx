import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | NotCast",
    default: "Hesap | NotCast",
  },
};

/**
 * Auth sayfaları layout — artık sayfa bileşenleri kendi full-screen layout'unu taşıyor
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
