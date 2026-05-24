import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input id="test" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Input id="name" label="Name" />);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("links label to input via htmlFor", () => {
    render(<Input id="email" label="Email" />);
    const label = screen.getByText("Email");
    const input = screen.getByRole("textbox");
    expect(label).toHaveAttribute("for", "email");
    expect(input).toHaveAttribute("id", "email");
  });

  it("shows error message", () => {
    render(<Input id="field" error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("applies error styling when error is set", () => {
    render(<Input id="field" error="Error" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toMatch(/red/);
  });

  it("is disabled when disabled prop is set", () => {
    render(<Input id="field" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<Input id="field" />);
    const input = screen.getByRole("textbox");
    await user.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("forwards placeholder", () => {
    render(<Input id="field" placeholder="Enter text..." />);
    expect(screen.getByPlaceholderText("Enter text...")).toBeInTheDocument();
  });

  it("forwards type attribute", () => {
    render(<Input id="field" type="email" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("type", "email");
  });

  it("applies custom className", () => {
    render(<Input id="field" className="custom-input" />);
    expect(screen.getByRole("textbox").className).toMatch(/custom-input/);
  });

  it("renders without label", () => {
    render(<Input id="bare" />);
    expect(screen.queryByRole("label")).toBeNull();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });
});
