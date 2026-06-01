import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { GamificationProvider, useGamification, ACHIEVEMENTS } from "@/components/gamification/GamificationProvider";

function Probe() {
  const g = useGamification();
  return (
    <div>
      <span data-testid="xp">{g.xp}</span>
      <span data-testid="level">{g.level}</span>
      <span data-testid="streak">{g.streak}</span>
      <span data-testid="progress">{g.progress}</span>
      <span data-testid="unlocked">{g.unlocked.join(",")}</span>
      <button onClick={() => g.addXp(50)}>add</button>
      <button onClick={() => g.addXp(120, "test")}>addLarge</button>
      <button onClick={() => g.unlock("first-prompt")}>unlock</button>
    </div>
  );
}

describe("GamificationProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides initial state", () => {
    render(
      <GamificationProvider>
        <Probe />
      </GamificationProvider>
    );
    expect(screen.getByTestId("xp").textContent).toBe("0");
    expect(screen.getByTestId("level").textContent).toBe("1");
    expect(Number(screen.getByTestId("streak").textContent)).toBeGreaterThanOrEqual(1);
  });

  it("adds XP and recomputes progress", () => {
    render(
      <GamificationProvider>
        <Probe />
      </GamificationProvider>
    );
    act(() => {
      screen.getByText("add").click();
    });
    expect(screen.getByTestId("xp").textContent).toBe("50");
    expect(Number(screen.getByTestId("progress").textContent)).toBeGreaterThan(0);
  });

  it("levels up when XP threshold is crossed and dispatches event", () => {
    let leveledUp = false;
    const listener = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d.leveledUp) leveledUp = true;
    };
    window.addEventListener("procon:xp-gained", listener);
    render(
      <GamificationProvider>
        <Probe />
      </GamificationProvider>
    );
    act(() => {
      screen.getByText("addLarge").click();
    });
    expect(Number(screen.getByTestId("level").textContent)).toBeGreaterThan(1);
    expect(leveledUp).toBe(true);
    window.removeEventListener("procon:xp-gained", listener);
  });

  it("unlocks achievements and prevents duplicates", () => {
    render(
      <GamificationProvider>
        <Probe />
      </GamificationProvider>
    );
    act(() => {
      screen.getByText("unlock").click();
      screen.getByText("unlock").click(); // second click should be no-op
    });
    expect(screen.getByTestId("unlocked").textContent).toBe("first-prompt");
    // XP from achievement only added once
    expect(Number(screen.getByTestId("xp").textContent)).toBe(ACHIEVEMENTS["first-prompt"].xp);
  });

  it("persists state to localStorage", () => {
    render(
      <GamificationProvider>
        <Probe />
      </GamificationProvider>
    );
    act(() => {
      screen.getByText("add").click();
    });
    const raw = localStorage.getItem("procon-gamification-v1");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    expect(parsed.xp).toBe(50);
  });

  it("ignores zero or negative XP", () => {
    function Z() {
      const g = useGamification();
      return <button onClick={() => g.addXp(0)}>zero</button>;
    }
    render(
      <GamificationProvider>
        <Probe />
        <Z />
      </GamificationProvider>
    );
    act(() => screen.getByText("zero").click());
    expect(screen.getByTestId("xp").textContent).toBe("0");
  });

  it("exports ACHIEVEMENTS catalogue with required fields", () => {
    expect(Object.keys(ACHIEVEMENTS).length).toBeGreaterThanOrEqual(8);
    for (const a of Object.values(ACHIEVEMENTS)) {
      expect(a.id).toBeTruthy();
      expect(a.title).toBeTruthy();
      expect(a.xp).toBeGreaterThan(0);
    }
  });
});
