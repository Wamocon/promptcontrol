import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/layout/Sidebar";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const mockUsePathname = vi.fn(() => "/dashboard");

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  usePathname: () => mockUsePathname(),
}));

describe("Sidebar", () => {
  it("renders all nav items for free plan", () => {
    render(<Sidebar plan="free" />);
    expect(screen.getByText("dashboard")).toBeInTheDocument();
    expect(screen.getByText("projects")).toBeInTheDocument();
    expect(screen.getByText("logs")).toBeInTheDocument();
    expect(screen.getByText("team")).toBeInTheDocument();
    expect(screen.getByText("profile")).toBeInTheDocument();
    expect(screen.getByText("settings")).toBeInTheDocument();
  });

  it("shows Free Plan upgrade link for free plan", () => {
    render(<Sidebar plan="free" />);
    expect(screen.getByText("Free Plan")).toBeInTheDocument();
    expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
  });

  it("shows Pro Plan badge for pro plan", () => {
    render(<Sidebar plan="pro" />);
    expect(screen.getByText("Pro Plan")).toBeInTheDocument();
    expect(screen.queryByText("Upgrade to Pro")).not.toBeInTheDocument();
  });

  it("does not show admin link when isAdmin is false", () => {
    render(<Sidebar plan="free" isAdmin={false} />);
    expect(screen.queryByText("admin")).not.toBeInTheDocument();
  });

  it("shows admin link when isAdmin is true", () => {
    render(<Sidebar plan="free" isAdmin={true} />);
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("admin link points to /dashboard/admin", () => {
    render(<Sidebar plan="free" isAdmin={true} />);
    const adminLink = screen.getByRole("link", { name: "admin" });
    expect(adminLink).toHaveAttribute("href", "/dashboard/admin");
  });

  it("marks dashboard link as active on /dashboard path", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<Sidebar plan="free" />);
    const dashboardLink = screen.getByRole("link", { name: /dashboard/ });
    expect(dashboardLink.className).toMatch(/indigo/);
  });

  it("marks projects link as active on /dashboard/projects path", () => {
    mockUsePathname.mockReturnValue("/dashboard/projects");
    render(<Sidebar plan="free" />);
    const projectsLink = screen.getByRole("link", { name: /projects/ });
    expect(projectsLink.className).toMatch(/indigo/);
  });

  it("admin link is active on /dashboard/admin path", () => {
    mockUsePathname.mockReturnValue("/dashboard/admin");
    render(<Sidebar plan="free" isAdmin={true} />);
    const adminLink = screen.getByRole("link", { name: "admin" });
    expect(adminLink.className).toMatch(/red/);
  });
});
