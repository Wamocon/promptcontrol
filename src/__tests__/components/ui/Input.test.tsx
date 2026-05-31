import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, Textarea, Select } from "@/components/ui/Input";

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
    expect(input.className).toMatch(/rose/);
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

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea id="area" />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Textarea id="area" label="Description" />);
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
  });

  it("links label to textarea via htmlFor", () => {
    render(<Textarea id="notes" label="Notes" />);
    expect(screen.getByText("Notes")).toHaveAttribute("for", "notes");
    expect(screen.getByRole("textbox")).toHaveAttribute("id", "notes");
  });

  it("shows error message", () => {
    render(<Textarea id="area" error="Too long" />);
    expect(screen.getByText("Too long")).toBeInTheDocument();
  });

  it("applies error styling when error is set", () => {
    render(<Textarea id="area" error="Error" />);
    expect(screen.getByRole("textbox").className).toMatch(/rose/);
  });

  it("is disabled when disabled prop is set", () => {
    render(<Textarea id="area" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<Textarea id="area" />);
    await user.type(screen.getByRole("textbox"), "hello textarea");
    expect(screen.getByRole("textbox")).toHaveValue("hello textarea");
  });

  it("applies custom className", () => {
    render(<Textarea id="area" className="custom-textarea" />);
    expect(screen.getByRole("textbox").className).toMatch(/custom-textarea/);
  });
});

describe("Select", () => {
  it("renders a select element", () => {
    render(<Select id="sel"><option value="a">A</option></Select>);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Select id="sel" label="Choose"><option value="a">A</option></Select>);
    expect(screen.getByLabelText("Choose")).toBeInTheDocument();
  });

  it("links label to select via htmlFor", () => {
    render(<Select id="sel" label="Pick one"><option value="x">X</option></Select>);
    expect(screen.getByText("Pick one")).toHaveAttribute("for", "sel");
    expect(screen.getByRole("combobox")).toHaveAttribute("id", "sel");
  });

  it("shows error message", () => {
    render(<Select id="sel" error="Required"><option value="">-</option></Select>);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("applies error styling when error is set", () => {
    render(<Select id="sel" error="Error"><option value="">-</option></Select>);
    expect(screen.getByRole("combobox").className).toMatch(/rose/);
  });

  it("is disabled when disabled prop is set", () => {
    render(<Select id="sel" disabled><option value="a">A</option></Select>);
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("renders children options", () => {
    render(
      <Select id="sel">
        <option value="one">One</option>
        <option value="two">Two</option>
      </Select>
    );
    expect(screen.getByRole("option", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Two" })).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Select id="sel" className="custom-select"><option value="a">A</option></Select>);
    expect(screen.getByRole("combobox").className).toMatch(/custom-select/);
  });
});
