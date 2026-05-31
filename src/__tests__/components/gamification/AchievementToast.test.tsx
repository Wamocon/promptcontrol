import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { AchievementToast } from "@/components/gamification/AchievementToast";

describe("AchievementToast", () => {
  beforeEach(() => {
    // nothing
  });

  it("renders nothing initially", () => {
    const { container } = render(<AchievementToast />);
    expect(container.firstChild).toBeNull();
  });

  it("shows toast on procon:achievement event", () => {
    render(<AchievementToast />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent("procon:achievement", {
          detail: { id: "first-prompt", title: "Erster Prompt", description: "Test", icon: "🚀", xp: 50 },
        })
      );
    });
    expect(screen.getByText("Erster Prompt")).toBeInTheDocument();
    expect(screen.getByText(/Achievement freigeschaltet/i)).toBeInTheDocument();
  });

  it("shows level-up toast only when leveledUp is true", () => {
    render(<AchievementToast />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent("procon:xp-gained", {
          detail: { amount: 10, leveledUp: false, level: 1 },
        })
      );
    });
    expect(screen.queryByText(/Level Up/i)).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(
        new CustomEvent("procon:xp-gained", {
          detail: { amount: 120, leveledUp: true, level: 2 },
        })
      );
    });
    expect(screen.getByText("Level 2 erreicht!")).toBeInTheDocument();
  });

  it("dismisses toast on close click", () => {
    render(<AchievementToast />);
    act(() => {
      window.dispatchEvent(
        new CustomEvent("procon:achievement", {
          detail: { id: "first-test", title: "Tester", description: "x", icon: "🧪", xp: 30 },
        })
      );
    });
    const closeBtn = screen.getByLabelText("Schliessen");
    fireEvent.click(closeBtn);
    expect(screen.queryByText("Tester")).not.toBeInTheDocument();
  });
});
