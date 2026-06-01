import { describe, it, expect, beforeAll, vi } from "vitest";
import { render } from "@testing-library/react";
import { CursorSpotlight } from "@/components/effects/CursorSpotlight";

beforeAll(() => {
  // jsdom defaults to (pointer: coarse) matching - force it to NOT match
  // so the spotlight component actually renders + attaches listeners.
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  // Polyfill requestAnimationFrame for jsdom
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
    global.cancelAnimationFrame = (id: number) => clearTimeout(id);
  }
});

describe("CursorSpotlight", () => {
  it("renders the spotlight container", () => {
    const { container } = render(<CursorSpotlight />);
    expect(container.querySelector("div[aria-hidden]")).not.toBeNull();
  });

  it("attaches mousemove listener without throwing", () => {
    render(<CursorSpotlight />);
    expect(() =>
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 200 }))
    ).not.toThrow();
  });
});
