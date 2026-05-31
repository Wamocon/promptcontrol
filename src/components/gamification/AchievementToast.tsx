"use client";

import { useEffect, useState, useCallback } from "react";
import { X, Trophy, Sparkles } from "lucide-react";
import type { AchievementId } from "./GamificationProvider";

interface ToastEntry {
  id: string;
  kind: "achievement" | "level-up" | "xp";
  title: string;
  description: string;
  icon: string;
}

/**
 * Listens for `procon:achievement`, `procon:xp-gained` events
 * dispatched by GamificationProvider and shows premium toasts
 * with confetti for achievements.
 */
export function AchievementToast() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    function onAch(e: Event) {
      const a = (e as CustomEvent).detail as { id: AchievementId; title: string; description: string; icon: string; xp: number };
      const t: ToastEntry = { id: `${a.id}-${Date.now()}`, kind: "achievement", title: a.title, description: `${a.description} +${a.xp} XP`, icon: a.icon };
      setToasts((arr) => [...arr, t]);
      setTimeout(() => dismiss(t.id), 5500);
    }
    function onXp(e: Event) {
      const d = (e as CustomEvent).detail as { amount: number; reason?: string; leveledUp: boolean; level: number };
      if (d.leveledUp) {
        const t: ToastEntry = { id: `lvl-${Date.now()}`, kind: "level-up", title: `Level ${d.level} erreicht!`, description: "Neue Belohnungen freigeschaltet.", icon: "✨" };
        setToasts((arr) => [...arr, t]);
        setTimeout(() => dismiss(t.id), 5500);
      }
    }
    window.addEventListener("procon:achievement", onAch);
    window.addEventListener("procon:xp-gained", onXp);
    return () => {
      window.removeEventListener("procon:achievement", onAch);
      window.removeEventListener("procon:xp-gained", onXp);
    };
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[110] flex flex-col gap-3 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto w-80 rounded-2xl achievement-glow gradient-border"
          style={{ animation: "slide-down-toast 0.4s cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <div className="glass-card rounded-2xl p-4 flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-2xl shrink-0">
              {t.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                {t.kind === "achievement" ? (
                  <Trophy className="h-3 w-3 text-amber-500" />
                ) : (
                  <Sparkles className="h-3 w-3 text-indigo-500" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  {t.kind === "achievement" ? "Achievement freigeschaltet" : "Level Up"}
                </span>
              </div>
              <div className="text-sm font-bold" style={{ color: "var(--text-1)" }}>{t.title}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{t.description}</div>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-current opacity-50 hover:opacity-100 transition"
              style={{ color: "var(--text-3)" }}
              aria-label="Schliessen"
              title="Schliessen"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
