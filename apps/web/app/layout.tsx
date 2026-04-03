import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { QueryProvider } from "@/components/shared/query-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Plus_Jakarta_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NotCast — Notlarını Podcast'e Dönüştür",
    template: "%s | NotCast",
  },
  description:
    "Ders notlarını yapay zeka ile analiz et, gerçekçi Türkçe sesle podcast formatında dinle.",
  keywords: ["not", "podcast", "öğrenci", "yapay zeka", "TTS", "öğrenme"],
  authors: [{ name: "NotCast" }],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    title: "NotCast — Notlarını Podcast'e Dönüştür",
    description: "Ders notlarını yapay zeka ile analiz et, gerçekçi Türkçe sesle podcast formatında dinle.",
    siteName: "NotCast",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
