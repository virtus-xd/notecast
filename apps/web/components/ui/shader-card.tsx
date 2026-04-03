"use client";

import type React from "react";
import { Warp } from "@paper-design/shaders-react";
import { ArrowRight } from "lucide-react";

interface ShaderConfig {
  proportion: number;
  softness: number;
  distortion: number;
  swirl: number;
  swirlIterations: number;
  shape: "checks" | "stripes" | "edge";
  shapeScale: number;
  colors: string[];
}

const SHADER_CONFIGS: ShaderConfig[] = [
  {
    proportion: 0.3,
    softness: 0.8,
    distortion: 0.15,
    swirl: 0.6,
    swirlIterations: 8,
    shape: "checks",
    shapeScale: 0.08,
    colors: ["hsl(193, 100%, 30%)", "hsl(200, 100%, 60%)", "hsl(180, 90%, 40%)", "hsl(195, 100%, 70%)"],
  },
  {
    proportion: 0.4,
    softness: 1.2,
    distortion: 0.2,
    swirl: 0.9,
    swirlIterations: 12,
    shape: "stripes",
    shapeScale: 0.12,
    colors: ["hsl(280, 100%, 30%)", "hsl(300, 100%, 60%)", "hsl(320, 90%, 40%)", "hsl(290, 100%, 70%)"],
  },
  {
    proportion: 0.35,
    softness: 0.9,
    distortion: 0.18,
    swirl: 0.7,
    swirlIterations: 10,
    shape: "checks",
    shapeScale: 0.1,
    colors: ["hsl(140, 100%, 25%)", "hsl(160, 100%, 55%)", "hsl(120, 90%, 30%)", "hsl(150, 100%, 65%)"],
  },
  {
    proportion: 0.45,
    softness: 1.1,
    distortion: 0.22,
    swirl: 0.8,
    swirlIterations: 15,
    shape: "stripes",
    shapeScale: 0.09,
    colors: ["hsl(30, 100%, 35%)", "hsl(50, 100%, 65%)", "hsl(40, 90%, 40%)", "hsl(45, 100%, 75%)"],
  },
  {
    proportion: 0.38,
    softness: 0.95,
    distortion: 0.16,
    swirl: 0.85,
    swirlIterations: 11,
    shape: "checks",
    shapeScale: 0.11,
    colors: ["hsl(250, 100%, 30%)", "hsl(270, 100%, 65%)", "hsl(260, 90%, 35%)", "hsl(265, 100%, 70%)"],
  },
  {
    proportion: 0.42,
    softness: 1.0,
    distortion: 0.19,
    swirl: 0.75,
    swirlIterations: 9,
    shape: "stripes",
    shapeScale: 0.13,
    colors: ["hsl(330, 100%, 30%)", "hsl(350, 100%, 60%)", "hsl(340, 90%, 35%)", "hsl(345, 100%, 75%)"],
  },
];

interface ShaderCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  stepLabel?: string;
}

export function ShaderCard({ icon, title, description, index, stepLabel }: ShaderCardProps) {
  const config = SHADER_CONFIGS[index % SHADER_CONFIGS.length]!;

  return (
    <div className="relative h-80">
      <div className="absolute inset-0 overflow-hidden rounded-3xl">
        <Warp
          style={{ height: "100%", width: "100%" }}
          proportion={config.proportion}
          softness={config.softness}
          distortion={config.distortion}
          swirl={config.swirl}
          swirlIterations={config.swirlIterations}
          shape={config.shape}
          shapeScale={config.shapeScale}
          scale={1}
          rotation={0}
          speed={0.8}
          colors={config.colors}
        />
      </div>

      <div className="relative z-10 flex h-full flex-col rounded-3xl border border-white/20 bg-black/80 p-8 dark:border-white/10">
        {stepLabel && (
          <span className="absolute right-8 top-6 text-4xl font-extrabold text-white/10">
            {stepLabel}
          </span>
        )}

        <div className="mb-6 drop-shadow-lg">{icon}</div>

        <h3 className="mb-4 text-2xl font-bold text-white">{title}</h3>

        <p className="flex-grow font-medium leading-relaxed text-gray-100">{description}</p>

        <div className="mt-6 flex items-center text-sm font-bold text-gray-200">
          <span className="mr-2">Daha fazla</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
