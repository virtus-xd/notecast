"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ──────── Context ────────

interface AlertDialogContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const AlertDialogContext = React.createContext<AlertDialogContextValue>({
  open: false,
  setOpen: () => {},
});

// ──────── Root ────────

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open: controlledOpen, onOpenChange, children }: AlertDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// ──────── Trigger ────────

export function AlertDialogTrigger({
  children,
  asChild,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { setOpen } = React.useContext(AlertDialogContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

// ──────── Portal + Overlay + Content ────────

export function AlertDialogContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, setOpen } = React.useContext(AlertDialogContext);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
        onClick={() => setOpen(false)}
      />
      {/* Content */}
      <div
        className={cn(
          "relative z-50 w-full max-w-md mx-4 rounded-xl border bg-background p-6 shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

// ──────── Header / Title / Description ────────

export function AlertDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("space-y-2", className)}>{children}</div>;
}

export function AlertDialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>;
}

export function AlertDialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

// ──────── Footer ────────

export function AlertDialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mt-6 flex justify-end gap-3", className)}>
      {children}
    </div>
  );
}

// ──────── Action Buttons ────────

export function AlertDialogCancel({
  children = "İptal",
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = React.useContext(AlertDialogContext);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
        "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onClick={(e) => {
        setOpen(false);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({
  children = "Devam Et",
  className,
  onClick,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setOpen } = React.useContext(AlertDialogContext);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
        "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
