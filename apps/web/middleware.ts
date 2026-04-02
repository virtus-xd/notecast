/**
 * Next.js Middleware — Rota koruması
 * Auth gerektiren sayfalara token yoksa /login'e yönlendir
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Giriş gerektiren yollar
const PROTECTED_PATHS = ["/dashboard", "/notes", "/podcasts", "/upload", "/settings"];

// Giriş yapmışken erişilemeyen yollar
const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Access token cookie veya header kontrolü
  // Not: HttpOnly cookie olmadığı için JS'te erişilebilen cookie kullanıyoruz
  const hasSession =
    request.cookies.has("refreshToken") ||
    request.headers.get("authorization")?.startsWith("Bearer ");

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Korunan sayfa + session yok → login'e yönlendir
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Auth sayfası + session var → dashboard'a yönlendir
  if (isAuthPath && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
