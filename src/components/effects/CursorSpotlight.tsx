"use client";

import { useEffect } from "react";

/**
 * Adds a global cursor-tracking spotlight that fades behind the UI.
 * Sets CSS variables --cursor-x/--cursor-y on document.documentElement.
 * Renders a fixed gradient that follows the cursor.
 */
export function CursorSpotlight() {
  useEffect(() => {
    // Disabled on touch devices and reduced-motion users
    const mq = window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function onMove(e: MouseEvent) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function tick() {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      document.documentElement.style.setProperty("--cursor-x", `${currentX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${currentY}px`);
      if (Math.abs(targetX - currentX) > 0.5 || Math.abs(targetY - currentY) > 0.5) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
      style={{
        background:
          "radial-gradient(600px circle at var(--cursor-x, 50vw) var(--cursor-y, 50vh), rgba(99, 102, 241, 0.06), transparent 50%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
