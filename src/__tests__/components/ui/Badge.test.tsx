import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Pro</Badge>);
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("applies default variant by default", () => {
    render(<Badge>Default</Badge>);
    const badge = screen.getByText("Default");
    expect(badge.className).toMatch(/zinc/);
  });

  it("applies success variant", () => {
    render(<Badge variant="success">Success</Badge>);
    expect(screen.getByText("Success").className).toMatch(/green/);
  });

  it("applies warning variant", () => {
    render(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText("Warning").className).toMatch(/yellow/);
  });

  it("applies danger variant", () => {
    render(<Badge variant="danger">Error</Badge>);
    expect(screen.getByText("Error").className).toMatch(/red/);
  });

  it("applies info variant", () => {
    render(<Badge variant="info">Info</Badge>);
    expect(screen.getByText("Info").className).toMatch(/indigo/);
  });

  it("applies pro variant", () => {
    render(<Badge variant="pro">Pro</Badge>);
    const badge = screen.getByText("Pro");
    expect(badge.className).toMatch(/gradient|from-indigo/);
  });

  it("applies custom className", () => {
    render(<Badge className="my-class">Custom</Badge>);
    expect(screen.getByText("Custom").className).toMatch(/my-class/);
  });

  it("renders as a span", () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText("Test").tagName).toBe("SPAN");
  });
});
