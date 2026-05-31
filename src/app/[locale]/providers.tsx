"use client";

import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

/**
 * The actual theme class is applied to <html> by an inline script in <head>
 * (ThemeBootstrap) BEFORE hydration, preventing FOUC. We still render the
 * next-themes ThemeProvider so useTheme() works in client components.
 *
 * Next.js 16's dev overlay logs a "script tag inside React component" warning
 * because next-themes injects its FOUC script into the React tree. The warning
 * is benign (FOUC is already handled by ThemeBootstrap), so we filter that one
 * specific console.error message in dev only.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const original = console.error;
    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === "string" ? args[0] : "";
      if (msg.includes("Encountered a script tag while rendering React component")) return;
      original.apply(console, args as never);
    };
    return () => {
      console.error = original;
    };
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
  );
}
