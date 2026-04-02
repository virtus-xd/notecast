"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * React Error Boundary — beklenmeyen render hatalarını yakalar ve kullanıcıya güzel bir hata ekranı gösterir
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // Production'da Sentry gibi bir servise gönderilebilir
    console.error("[ErrorBoundary] Yakalanmayan hata:", error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Bir şeyler ters gitti
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi veya ana sayfaya dönmeyi deneyin.
        </p>
        {process.env.NODE_ENV === "development" && error && (
          <details className="mt-4 rounded border bg-muted p-3 text-left text-xs">
            <summary className="cursor-pointer font-medium">Hata detayı (geliştirme modu)</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap text-destructive">
              {error.message}
              {"\n"}
              {error.stack}
            </pre>
          </details>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Tekrar Dene
        </Button>
        <Button asChild className="gap-2">
          <Link href="/dashboard">
            <Home className="h-4 w-4" />
            Ana Sayfaya Dön
          </Link>
        </Button>
      </div>
    </div>
  );
}

/**
 * Basit fonksiyon wrapper — async server component hataları için kullanılır
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
