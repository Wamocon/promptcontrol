import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";

describe("Dialog", () => {
  it("renders null when closed", () => {
    const { container } = render(
      <Dialog open={false} onClose={() => {}} title="Test" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders when open", () => {
    render(<Dialog open={true} onClose={() => {}} title="My Dialog" />);
    expect(screen.getByText("My Dialog")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Test" description="My description" />
    );
    expect(screen.getByText("My description")).toBeInTheDocument();
  });

  it("does not render description paragraph when not provided", () => {
    render(<Dialog open={true} onClose={() => {}} title="Test" />);
    expect(screen.queryByText("My description")).not.toBeInTheDocument();
  });

  it("renders children", () => {
    render(
      <Dialog open={true} onClose={() => {}} title="Test">
        <span>child content</span>
      </Dialog>
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog open={true} onClose={onClose} title="Test" />
    );
    // outer div > backdrop div (first child)
    const backdrop = container.firstElementChild!.firstElementChild!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("applies custom className to dialog panel", () => {
    const { container } = render(
      <Dialog open={true} onClose={() => {}} title="Test" className="my-custom" />
    );
    expect(container.querySelector(".my-custom")).toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("renders null when closed", () => {
    const { container } = render(
      <ConfirmDialog open={false} onClose={() => {}} onConfirm={() => {}} title="Delete?" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title and default buttons when open", () => {
    render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} title="Delete item?" />
    );
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
    expect(screen.getByText("Abbrechen")).toBeInTheDocument();
    expect(screen.getByText("Bestätigen")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Test"
        description="This cannot be undone."
      />
    );
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog open={true} onClose={onClose} onConfirm={() => {}} title="Test" />
    );
    fireEvent.click(screen.getByText("Abbrechen"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when confirm button is clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={onConfirm} title="Test" />
    );
    fireEvent.click(screen.getByText("Bestätigen"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("uses custom confirmLabel", () => {
    render(
      <ConfirmDialog
        open={true}
        onClose={() => {}}
        onConfirm={() => {}}
        title="Test"
        confirmLabel="Ja, löschen"
      />
    );
    expect(screen.getByText("Ja, löschen")).toBeInTheDocument();
  });

  it("disables confirm button when loading", () => {
    render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} title="Test" loading={true} />
    );
    // When loading=true the button renders "..." instead of confirmLabel
    expect(screen.getByText("...")).toBeDisabled();
  });

  it("confirm button is enabled and shows label when not loading", () => {
    render(
      <ConfirmDialog open={true} onClose={() => {}} onConfirm={() => {}} title="Test" loading={false} />
    );
    const buttons = screen.getAllByRole("button");
    const confirmBtn = buttons[buttons.length - 1];
    expect(confirmBtn).not.toBeDisabled();
  });
});
