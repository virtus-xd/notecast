"use client";

import { cn } from "@/lib/utils";

export interface BentoItem {
  title: string;
  description?: string;
  icon: React.ReactNode;
  status?: string;
  tags?: string[];
  meta?: string;
  cta?: string;
  colSpan?: number;
  hasPersistentHover?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

interface BentoGridProps {
  items: BentoItem[];
  className?: string;
}

export function BentoGrid({ items, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-3",
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          onClick={item.onClick}
          className={cn(
            "group relative p-5 rounded-xl overflow-hidden transition-all duration-300",
            "border bg-card text-card-foreground",
            "hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_2px_12px_rgba(255,255,255,0.04)]",
            "hover:-translate-y-0.5 will-change-transform",
            item.colSpan === 2 ? "md:col-span-2" : "col-span-1",
            item.hasPersistentHover &&
              "shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_12px_rgba(255,255,255,0.03)] -translate-y-0.5",
            item.onClick && "cursor-pointer",
            item.className
          )}
        >
          {/* Dot pattern on hover */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              item.hasPersistentHover
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
            )}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:4px_4px]" />
          </div>

          {/* Content */}
          <div className="relative flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 group-hover:bg-primary/15 transition-all duration-300">
                {item.icon}
              </div>
              {item.status && (
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-lg",
                    "bg-muted text-muted-foreground",
                    "transition-colors duration-300 group-hover:bg-muted/80"
                  )}
                >
                  {item.status}
                </span>
              )}
            </div>

            {/* Custom children or default layout */}
            {item.children ? (
              item.children
            ) : (
              <div className="space-y-1.5">
                <h3 className="font-medium tracking-tight text-sm">
                  {item.title}
                  {item.meta && (
                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                      {item.meta}
                    </span>
                  )}
                </h3>
                {item.description && (
                  <p className="text-xs text-muted-foreground leading-snug">
                    {item.description}
                  </p>
                )}
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {item.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-muted/60 transition-all duration-200 hover:bg-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {item.cta && (
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.cta}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Border gradient on hover */}
          <div
            className={cn(
              "absolute inset-0 -z-10 rounded-xl p-px bg-gradient-to-br from-transparent via-border/50 to-transparent",
              item.hasPersistentHover
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100",
              "transition-opacity duration-300"
            )}
          />
        </div>
      ))}
    </div>
  );
}
