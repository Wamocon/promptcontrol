import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Content</Card>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("applies default styles", () => {
    const { container } = render(<Card>Card</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/glass-card|card-hover/);
  });

  it("applies custom className", () => {
    const { container } = render(<Card className="extra-class">Card</Card>);
    expect((container.firstChild as HTMLElement).className).toMatch(/extra-class/);
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText("Header")).toBeInTheDocument();
  });
});

describe("CardTitle", () => {
  it("renders as h3", () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Title");
  });
});

describe("CardDescription", () => {
  it("renders children", () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("applies muted style", () => {
    render(<CardDescription>Desc</CardDescription>);
    expect(screen.getByText("Desc").className).toMatch(/t3/);
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Content area</CardContent>);
    expect(screen.getByText("Content area")).toBeInTheDocument();
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter>Footer</CardFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("has flex layout", () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect((container.firstChild as HTMLElement).className).toMatch(/flex/);
  });
});
