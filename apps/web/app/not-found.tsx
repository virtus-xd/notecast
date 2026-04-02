import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-extrabold text-primary">404</h1>
        <p className="text-xl font-semibold">Sayfa bulunamadı</p>
        <p className="text-muted-foreground">Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <Button asChild>
          <Link href="/dashboard">Dashboard'a Dön</Link>
        </Button>
      </div>
    </div>
  );
}
