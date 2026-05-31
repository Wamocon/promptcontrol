"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

/**
 * Gamification context. Phase-1 lokal-persistiert (localStorage),
 * Phase-2 wird auf Supabase migriert (user_xp, user_achievements).
 */

export type AchievementId =
  | "first-prompt"
  | "first-test"
  | "streak-3"
  | "streak-7"
  | "ten-prompts"
  | "fifty-runs"
  | "first-ab-test"
  | "team-builder"
  | "explorer";

interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  xp: number;
}

const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  "first-prompt":  { id: "first-prompt",  title: "Erster Prompt",       description: "Du hast deinen ersten Prompt erstellt.",    icon: "🚀", xp: 50 },
  "first-test":    { id: "first-test",    title: "Tester",              description: "Erster Prompt-Test ausgefuhrt.",            icon: "🧪", xp: 30 },
  "streak-3":      { id: "streak-3",      title: "3-Tage-Streak",       description: "Drei Tage in Folge aktiv.",                  icon: "🔥", xp: 75 },
  "streak-7":      { id: "streak-7",      title: "Wochen-Held",         description: "Sieben Tage in Folge aktiv.",                icon: "⭐", xp: 200 },
  "ten-prompts":   { id: "ten-prompts",   title: "Prompt-Sammler",      description: "10 Prompts erstellt.",                       icon: "📚", xp: 150 },
  "fifty-runs":    { id: "fifty-runs",    title: "Power-User",          description: "50 Prompt-Ausfuhrungen erreicht.",           icon: "⚡", xp: 250 },
  "first-ab-test": { id: "first-ab-test", title: "Experimentator",      description: "Ersten A/B-Test angelegt.",                  icon: "🔬", xp: 100 },
  "team-builder":  { id: "team-builder",  title: "Team-Builder",        description: "Ersten Kollegen eingeladen.",                icon: "🤝", xp: 80 },
  "explorer":      { id: "explorer",      title: "Entdecker",           description: "Alle Hauptbereiche besucht.",                icon: "🗺️", xp: 40 },
};

interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastActive: string | null;
  unlocked: AchievementId[];
}

interface GamificationContextValue extends GamificationState {
  addXp: (amount: number, reason?: string) => void;
  unlock: (id: AchievementId) => void;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progress: number;
}

const STORAGE_KEY = "procon-gamification-v1";
const DEFAULT_STATE: GamificationState = { xp: 0, level: 1, streak: 0, lastActive: null, unlocked: [] };

// Level curve: Level n requires n * 100 XP cumulatively per level
function levelFromXp(xp: number) {
  let level = 1;
  let needed = 100;
  let remaining = xp;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = level * 100;
  }
  return { level, xpInLevel: remaining, xpForNext: needed };
}

const GamificationContext = createContext<GamificationContextValue | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GamificationState>(DEFAULT_STATE);
  const initialized = useRef(false);

  // Load + streak update on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const loaded: GamificationState = raw ? JSON.parse(raw) : DEFAULT_STATE;
      const today = new Date().toISOString().slice(0, 10);
      let { streak, lastActive } = loaded;
      if (lastActive !== today) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        streak = lastActive === yesterday ? streak + 1 : 1;
        lastActive = today;
      }
      setState({ ...loaded, streak, lastActive });
      initialized.current = true;
    } catch {
      initialized.current = true;
    }
  }, []);

  // Persist
  useEffect(() => {
    if (!initialized.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  // Auto-unlock streak achievements
  useEffect(() => {
    if (!initialized.current) return;
    if (state.streak >= 7 && !state.unlocked.includes("streak-7")) unlock("streak-7");
    else if (state.streak >= 3 && !state.unlocked.includes("streak-3")) unlock("streak-3");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.streak]);

  const addXp = useCallback((amount: number, reason?: string) => {
    if (amount <= 0) return;
    setState((s) => {
      const newXp = s.xp + amount;
      const lvl = levelFromXp(newXp);
      const leveledUp = lvl.level > s.level;
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("procon:xp-gained", { detail: { amount, reason, leveledUp, level: lvl.level } }));
      }
      return { ...s, xp: newXp, level: lvl.level };
    });
  }, []);

  const unlock = useCallback((id: AchievementId) => {
    setState((s) => {
      if (s.unlocked.includes(id)) return s;
      const a = ACHIEVEMENTS[id];
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("procon:achievement", { detail: a }));
      }
      const newXp = s.xp + a.xp;
      const lvl = levelFromXp(newXp);
      return { ...s, xp: newXp, level: lvl.level, unlocked: [...s.unlocked, id] };
    });
  }, []);

  const lvl = levelFromXp(state.xp);
  const value: GamificationContextValue = {
    ...state,
    addXp,
    unlock,
    xpInCurrentLevel: lvl.xpInLevel,
    xpForNextLevel: lvl.xpForNext,
    progress: Math.round((lvl.xpInLevel / lvl.xpForNext) * 100),
  };

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>;
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error("useGamification must be used within GamificationProvider");
  return ctx;
}

export { ACHIEVEMENTS };
