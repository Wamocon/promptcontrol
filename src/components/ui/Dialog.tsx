"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn("relative z-10 w-full max-w-lg rounded-2xl border border-white/8 p-6 shadow-2xl", className)}
        style={{ background: "rgba(10,14,26,0.97)", backdropFilter: "blur(24px)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-white/90">{title}</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/65 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {description && <p className="mt-1 text-sm text-white/40">{description}</p>}
        <div className="mt-5">{children}</div>
      </div>
    </div>
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
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white/55 border border-white/10 hover:bg-white/5 transition-colors"
        >
          Abbrechen
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="rounded-xl bg-rose-500/15 border border-rose-500/25 px-4 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/25 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}

