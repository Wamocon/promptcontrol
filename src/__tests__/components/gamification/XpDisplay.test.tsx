import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GamificationProvider } from "@/components/gamification/GamificationProvider";
import { XpDisplay } from "@/components/gamification/XpDisplay";

describe("XpDisplay", () => {
  it("renders level badge and XP fraction", () => {
    render(
      <GamificationProvider>
        <XpDisplay />
      </GamificationProvider>
    );
    expect(screen.getByText(/L1/)).toBeInTheDocument();
    expect(screen.getByText(/0\/100/)).toBeInTheDocument();
  });

  it("renders streak flame when streak > 0", () => {
    localStorage.setItem(
      "procon-gamification-v1",
      JSON.stringify({ xp: 0, level: 1, streak: 5, lastActive: new Date().toISOString().slice(0, 10), unlocked: [] })
    );
    render(
      <GamificationProvider>
        <XpDisplay />
      </GamificationProvider>
    );
    expect(screen.getByTitle(/Tage in Folge/)).toBeInTheDocument();
  });

  it("renders achievement count when unlocked > 0", () => {
    localStorage.setItem(
      "procon-gamification-v1",
      JSON.stringify({ xp: 50, level: 1, streak: 1, lastActive: new Date().toISOString().slice(0, 10), unlocked: ["first-prompt"] })
    );
    render(
      <GamificationProvider>
        <XpDisplay />
      </GamificationProvider>
    );
    expect(screen.getByTitle(/Achievement/)).toBeInTheDocument();
  });
});

describe("XpDisplay - storage updates", () => {
  it("reads persisted state on mount", () => {
    localStorage.setItem(
      "procon-gamification-v1",
      JSON.stringify({ xp: 250, level: 2, streak: 2, lastActive: new Date().toISOString().slice(0, 10), unlocked: [] })
    );
    render(
      <GamificationProvider>
        <XpDisplay />
      </GamificationProvider>
    );
    expect(screen.getByText(/L2/)).toBeInTheDocument();
  });
});
