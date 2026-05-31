"use client";

import { useGamification } from "./GamificationProvider";
import { Trophy } from "lucide-react";

/**
 * Compact XP display for the header.
 * Shows level badge, XP progress bar, and streak flame.
 */
export function XpDisplay() {
  const { level, streak, xpInCurrentLevel, xpForNextLevel, progress, unlocked } = useGamification();

  return (
    <div className="flex items-center gap-3">
      {/* Streak */}
      {streak > 0 && (
        <span className="streak-flame" title={`${streak} Tage in Folge aktiv`}>
          {streak}
        </span>
      )}

      {/* Level + XP bar */}
      <div className="hidden md:flex items-center gap-2.5" title={`Level ${level} - ${xpInCurrentLevel}/${xpForNextLevel} XP`}>
        <div className="level-badge">L{level}</div>
        <div className="flex flex-col gap-1 w-28">
          <div className="flex items-center justify-between text-[10px] font-medium" style={{ color: "var(--text-3)" }}>
            <span>XP</span>
            <span className="font-mono">{xpInCurrentLevel}/{xpForNextLevel}</span>
          </div>
          <div className="xp-bar">
            <div className="xp-bar-fill" style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
        </div>
      </div>

      {/* Achievements count */}
      {unlocked.length > 0 && (
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
          style={{ background: "var(--panel-bg-subtle)", color: "var(--text-2)" }}
          title={`${unlocked.length} Achievement${unlocked.length === 1 ? "" : "s"} freigeschaltet`}
        >
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          {unlocked.length}
        </div>
      )}
    </div>
  );
}
