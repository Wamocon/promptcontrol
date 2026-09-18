import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileTabBar } from "@/components/layout/MobileTabBar";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUsePathname = vi.fn(() => "/dashboard");

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    className,
    onClick,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => mockUsePathname(),
}));

describe("MobileTabBar", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("zeigt die drei festen Ziele plus Suche und Mehr", () => {
    render(<MobileTabBar />);
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText("skills")).toBeInTheDocument();
    expect(screen.getByText("projects")).toBeInTheDocument();
    expect(screen.getByText("search")).toBeInTheDocument();
    expect(screen.getByText("more")).toBeInTheDocument();
  });

  it("markiert das aktive Ziel per aria-current", () => {
    mockUsePathname.mockReturnValue("/dashboard/skills");
    render(<MobileTabBar />);
    const skillsLink = screen.getByRole("link", { name: /skills/ });
    expect(skillsLink).toHaveAttribute("aria-current", "page");
  });

  it("markiert das Dashboard nur bei exakter Uebereinstimmung", () => {
    mockUsePathname.mockReturnValue("/dashboard/skills");
    render(<MobileTabBar />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/ });
    expect(dashboardLink).not.toHaveAttribute("aria-current");
  });

  it("oeffnet und schliesst das Mehr-Menue", () => {
    render(<MobileTabBar />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("more"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("team")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("zeigt den Adminbereich im Mehr-Menue nur fuer Admins", () => {
    const { unmount } = render(<MobileTabBar isAdmin={false} />);
    fireEvent.click(screen.getByText("more"));
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
    unmount();

    render(<MobileTabBar isAdmin={true} />);
    fireEvent.click(screen.getByText("more"));
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("schliesst das Mehr-Menue beim Navigieren", () => {
    render(<MobileTabBar />);
    fireEvent.click(screen.getByText("more"));
    fireEvent.click(screen.getByRole("link", { name: /team/ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("loest die Befehlspalette ueber den Suche-Knopf aus", () => {
    const handler = vi.fn();
    window.addEventListener("keydown", handler);
    render(<MobileTabBar />);
    fireEvent.click(screen.getByText("search"));
    expect(handler).toHaveBeenCalled();
    window.removeEventListener("keydown", handler);
  });

  it("hat eine beschriftete Hauptnavigation", () => {
    render(<MobileTabBar />);
    expect(screen.getByRole("navigation", { name: "mainNavigation" })).toBeInTheDocument();
  });
});
