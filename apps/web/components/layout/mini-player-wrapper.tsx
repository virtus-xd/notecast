"use client";

import dynamic from "next/dynamic";

// SSR devre dışı — Audio API yalnızca tarayıcıda mevcut
const MiniPlayer = dynamic(
  () => import("@/components/podcasts/mini-player").then((m) => m.MiniPlayer),
  { ssr: false }
);

export function MiniPlayerWrapper() {
  return <MiniPlayer />;
}
