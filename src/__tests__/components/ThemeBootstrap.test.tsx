import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";

describe("ThemeBootstrap", () => {
  it("renders an inline script that initialises theme class", () => {
    const html = renderToString(<ThemeBootstrap />);
    expect(html).toMatch(/<script/);
    expect(html).toContain("localStorage.getItem('theme')");
    expect(html).toContain("classList.add('dark')");
    expect(html).toContain("classList.add('light')");
  });
});
