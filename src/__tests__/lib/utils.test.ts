import { describe, it, expect } from "vitest";
import { cn, formatDate, formatCost, slugify } from "@/lib/utils";

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("deduplicates Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("handles undefined and null", () => {
    expect(cn("a", undefined, null, "b")).toBe("a b");
  });

  it("handles empty string", () => {
    expect(cn("")).toBe("");
  });

  it("handles object notation", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500");
  });

  it("handles array notation", () => {
    expect(cn(["a", "b"])).toBe("a b");
  });
});

describe("formatDate()", () => {
  it("formats a date string", () => {
    const result = formatDate("2024-01-15T10:30:00Z");
    expect(result).toMatch(/15\.01\.2024/);
  });

  it("formats a Date object", () => {
    const result = formatDate(new Date("2024-06-01T12:00:00Z"));
    expect(result).toMatch(/01\.06\.2024/);
  });

  it("includes time", () => {
    const result = formatDate("2024-01-15T14:30:00.000Z");
    expect(result).toContain(":");
  });
});

describe("formatCost()", () => {
  it("formats zero cost", () => {
    expect(formatCost(0)).toContain("0");
  });

  it("formats a small cost with 4 decimal places", () => {
    const result = formatCost(0.0012);
    expect(result).toMatch(/0,001[0-9]/);
  });

  it("formats larger costs", () => {
    const result = formatCost(1.5);
    expect(result).toContain("1");
  });

  it("includes currency symbol", () => {
    const result = formatCost(1);
    expect(result).toMatch(/\$|USD/);
  });
});

describe("slugify()", () => {
  it("lowercases text", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with dashes", () => {
    expect(slugify("my prompt name")).toBe("my-prompt-name");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! World?")).toBe("hello-world");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("collapses multiple dashes", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles already-slugified input", () => {
    expect(slugify("my-prompt")).toBe("my-prompt");
  });

  it("handles numbers", () => {
    expect(slugify("Version 2.0")).toBe("version-20");
  });

  it("handles unicode chars", () => {
    expect(slugify("Ünité")).toBe("nit");
  });
});
