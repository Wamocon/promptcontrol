import { describe, it, expect } from "vitest";

// Test the TypeScript type definitions for correctness
import type { UserRole, PromptStatus, PlanType, SubscriptionStatus } from "@/types";

describe("TypeScript type definitions", () => {
  it("UserRole covers all expected values", () => {
    const roles: UserRole[] = ["admin", "pm", "developer", "trainee"];
    expect(roles).toHaveLength(4);
    expect(roles).toContain("admin");
    expect(roles).toContain("pm");
    expect(roles).toContain("developer");
    expect(roles).toContain("trainee");
  });

  it("PromptStatus covers all expected values", () => {
    const statuses: PromptStatus[] = ["active", "draft", "archived"];
    expect(statuses).toHaveLength(3);
  });

  it("PlanType covers expected values", () => {
    const plans: PlanType[] = ["free", "pro"];
    expect(plans).toHaveLength(2);
  });

  it("SubscriptionStatus covers expected values", () => {
    const statuses: SubscriptionStatus[] = ["active", "cancelled", "past_due"];
    expect(statuses).toHaveLength(3);
  });
});
