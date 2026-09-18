"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

type DialogSize = "sm" | "md" | "lg";

/** Der Mount-Zustand aendert sich nie, es wird also nichts abonniert. */
function subscribeNoop() {
  return () => {};
}

const sizeClasses: Record<DialogSize, string> = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  // Auf dem Handy echtes Vollbild (dvh statt vh, sonst schneidet die
  // Safari-Leiste unten ab), ab md wieder das bisherige Panel.
  lg: "max-md:fixed max-md:inset-0 max-md:h-dvh max-md:w-full max-md:max-w-none max-md:rounded-none md:w-[92vw] md:max-w-7xl md:h-[90dvh] flex flex-col",
};

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  /** S = compact (default), M = medium, L = fills viewport */
  size?: DialogSize;
}

export function Dialog({ open, onClose, title, description, children, className, size = "sm" }: DialogProps) {
  // Der Dialog wird per Portal an den body gehaengt. Ohne das landet er im
  // Stacking-Context der Seiten-Einblendanimation (transform erzeugt einen
  // eigenen Context) und liegt dann unter der unteren Navigationsleiste.
  // Das Portal darf erst nach der Hydration greifen, deshalb dasselbe
  // useSyncExternalStore-Muster wie im DSGVO-Banner.
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  // Escape schliesst den Dialog, und solange er offen ist scrollt der
  // Hintergrund nicht mit (auf dem Handy sonst besonders stoerend).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const isLg = size === "lg";

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        isLg ? "max-md:p-0 md:p-4" : "p-4"
      )}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "panel relative z-10 w-full shadow-2xl",
          sizeClasses[size],
          isLg ? "p-0 overflow-hidden" : "p-6",
          className,
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between shrink-0",
          isLg ? "px-4 py-3 md:px-6 md:py-4 border-b max-md:pt-safe" : "mb-1",
        )}
          style={isLg ? { borderColor: "var(--panel-border)" } : undefined}
        >
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-bold text-t1 truncate">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-t3">{description}</p>}
          </div>
          {/* 44px Trefferflaeche, das blosse Icon waere mit 20px zu klein (WCAG 2.5.8) */}
          <button
            onClick={onClose}
            aria-label="Dialog schließen"
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-xl text-t4 hover:text-t1 transition-colors touch-manipulation"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className={cn(
          isLg ? "flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5 max-md:pb-safe-4" : "mt-5",
        )}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Bestätigen", loading }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          onClick={onClose}
          className="min-h-11 rounded-xl px-4 py-2 text-sm font-medium text-t2 border border-[color:var(--panel-border)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors touch-manipulation"
        >
          Abbrechen
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="min-h-11 rounded-xl bg-rose-500/15 border border-rose-500/25 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/25 disabled:opacity-50 transition-colors touch-manipulation"
        >
          {loading ? "..." : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
