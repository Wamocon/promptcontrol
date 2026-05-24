import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GdprBanner } from "@/components/GdprBanner";

vi.mock("next/link", () => ({
  default: ({
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
}));

describe("GdprBanner", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders when no consent is stored", () => {
    render(<GdprBanner />);
    expect(screen.getByText("Cookie-Einstellungen")).toBeInTheDocument();
  });

  it("renders the privacy link", () => {
    render(<GdprBanner />);
    const link = screen.getByRole("link", { name: /datenschutzerklärung/i });
    expect(link).toHaveAttribute("href", "/legal/datenschutz");
  });

  it("does not render when consent is already accepted", () => {
    localStorage.setItem("pc-gdpr-consent", "accepted");
    const { container } = render(<GdprBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when consent is already declined", () => {
    localStorage.setItem("pc-gdpr-consent", "declined");
    const { container } = render(<GdprBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("hides banner and stores accepted on accept click", () => {
    const { container } = render(<GdprBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Akzeptieren" }));
    expect(localStorage.getItem("pc-gdpr-consent")).toBe("accepted");
    expect(container).toBeEmptyDOMElement();
  });

  it("hides banner and stores declined on decline click", () => {
    const { container } = render(<GdprBanner />);
    fireEvent.click(screen.getByRole("button", { name: "Ablehnen" }));
    expect(localStorage.getItem("pc-gdpr-consent")).toBe("declined");
    expect(container).toBeEmptyDOMElement();
  });

  it("hides banner when X button is clicked", () => {
    const { container } = render(<GdprBanner />);
    // X button is the first button (top-right close icon)
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(localStorage.getItem("pc-gdpr-consent")).toBe("declined");
    expect(container).toBeEmptyDOMElement();
  });
});
