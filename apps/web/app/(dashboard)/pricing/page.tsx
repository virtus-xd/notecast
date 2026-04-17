"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Check,
  Crown,
  Zap,
  Headphones,
  Infinity,
  Mic2,
  ShieldCheck,
  Loader2,
  ArrowLeft,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import apiClient from "@/lib/api";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ApiSuccessResponse } from "@notcast/shared";

const FREE_FEATURES = [
  { icon: Headphones, text: "Ayda 3 podcast oluşturma" },
  { icon: Mic2, text: "Google WaveNet sesleri" },
  { icon: Check, text: "OCR ile not işleme" },
  { icon: Check, text: "3 podcast stili" },
];

const PREMIUM_FEATURES = [
  { icon: Infinity, text: "Sınırsız podcast oluşturma", highlight: true },
  { icon: Mic2, text: "Tüm ses modelleri (WaveNet + Chirp 3 HD)", highlight: true },
  { icon: Zap, text: "Öncelikli işleme kuyruğu", highlight: true },
  { icon: ShieldCheck, text: "Öncelikli destek" },
  { icon: Check, text: "OCR ile not işleme" },
  { icon: Check, text: "3 podcast stili" },
];

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [showCanceled, setShowCanceled] = useState(searchParams.get("session") === "canceled");

  const isPremium = user?.role === "PREMIUM" || user?.role === "ADMIN";

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiSuccessResponse<{ url: string }>>(
        "/payments/checkout"
      );
      return data.data.url;
    },
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      toast.error(err.response?.data?.error?.message ?? "Ödeme sayfası oluşturulamadı");
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Planlar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            İhtiyacınıza uygun planı seçin
          </p>
        </div>
      </div>

      {/* Ödeme iptal bildirimi */}
      {showCanceled && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <X
            className="h-4 w-4 text-yellow-600 cursor-pointer flex-shrink-0"
            onClick={() => setShowCanceled(false)}
          />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Ödeme tamamlanmadı. Dilediğiniz zaman tekrar deneyebilirsiniz.
          </p>
        </div>
      )}

      {/* Plan Kartları */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ücretsiz Plan */}
        <Card className={cn(
          "relative overflow-hidden transition-shadow",
          !isPremium && "border-primary/30"
        )}>
          {!isPremium && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
          )}
          <CardContent className="p-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ücretsiz</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">₺0</span>
                <span className="text-muted-foreground text-sm">/ ay</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Temel özelliklerle başlayın
              </p>
            </div>

            <div className="space-y-3">
              {FREE_FEATURES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full"
              disabled
            >
              {!isPremium ? "Mevcut Plan" : "Ücretsiz Plan"}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className={cn(
          "relative overflow-hidden transition-shadow border-2",
          isPremium ? "border-yellow-400 shadow-lg shadow-yellow-100 dark:shadow-yellow-950/30" : "border-primary shadow-lg shadow-primary/10"
        )}>
          <div className={cn(
            "absolute top-0 left-0 right-0 h-1",
            isPremium ? "bg-yellow-400" : "bg-gradient-to-r from-primary to-purple-500"
          )} />
          {/* Popüler etiketi */}
          {!isPremium && (
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                <Zap className="h-3 w-3" /> Önerilen
              </span>
            </div>
          )}
          <CardContent className="p-6 space-y-6">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                <Crown className="h-4 w-4" /> Premium
              </p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-4xl font-bold">₺99</span>
                <span className="text-muted-foreground text-sm">/ ay</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Sınırsız erişim ile tam güç
              </p>
            </div>

            <div className="space-y-3">
              {PREMIUM_FEATURES.map(({ icon: Icon, text, highlight }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className={cn(
                    "flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center",
                    highlight ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "h-3 w-3",
                      highlight ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <span className={cn("text-sm", highlight && "font-medium")}>{text}</span>
                </div>
              ))}
            </div>

            {isPremium ? (
              <Button
                variant="outline"
                className="w-full border-yellow-400 text-yellow-700 dark:text-yellow-400"
                disabled
              >
                <Crown className="h-4 w-4" /> Aktif Premium Üye
              </Button>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                size="lg"
                onClick={() => checkoutMutation.mutate()}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Yönlendiriliyor...</>
                ) : (
                  <><Crown className="h-4 w-4" /> Premium'a Yükselt</>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alt bilgi */}
      <p className="text-center text-xs text-muted-foreground">
        İstediğiniz zaman iptal edebilirsiniz. Aboneliğiniz dönem sonuna kadar aktif kalır.
      </p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
