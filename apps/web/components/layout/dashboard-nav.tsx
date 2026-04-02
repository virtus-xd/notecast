"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Headphones, Upload, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: User },
  { href: "/notes", label: "Notlarım", icon: BookOpen },
  { href: "/podcasts", label: "Podcast'lerim", icon: Headphones },
  { href: "/upload", label: "Not Yükle", icon: Upload },
] as const;

export function DashboardNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-black">N</span>
            </div>
            <span className="font-bold text-primary">NotCast</span>
          </Link>

          {/* Navigasyon */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Kullanıcı */}
          <div className="flex items-center gap-1">
            {user && (
              <span className="hidden sm:block text-sm text-muted-foreground mr-2">
                {user.name}
              </span>
            )}
            <ThemeToggle />
            <Link href="/settings">
              <Button variant="ghost" size="icon" aria-label="Ayarlar">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Çıkış yap"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
