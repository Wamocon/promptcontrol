"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "./ui/Button";

const STORAGE_KEY = "pc-gdpr-consent";

function subscribe(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

function readConsent(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function GdprBanner() {
  // SSR snapshot is always "consented" (banner hidden) to keep server HTML
  // stable; the client snapshot reads the real value after hydration.
  const consent = useSyncExternalStore(
    subscribe,
    readConsent,
    () => "ssr-consented"
  );

  // Local override so accept/decline hide immediately even before storage event.
  const [dismissed, setDismissed] = useState(false);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch {}
    setDismissed(true);
  }

  function decline() {
    try { localStorage.setItem(STORAGE_KEY, "declined"); } catch {}
    setDismissed(true);
  }

  if (consent || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="glass-card p-5 shadow-2xl">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Cookie-Einstellungen</p>
          <button onClick={decline} className="ml-2 transition-colors" style={{ color: "var(--text-4)" }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs mb-5 leading-relaxed" style={{ color: "var(--text-3)" }}>
          Wir verwenden notwendige Cookies für den Betrieb dieser Plattform. Durch die Nutzung stimmen Sie unserer{" "}
          <Link href="/legal/datenschutz" className="text-indigo-500 underline hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300">Datenschutzerklärung</Link> zu.
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={decline} className="flex-1">
            Ablehnen
          </Button>
          <Button size="sm" onClick={accept} className="flex-1">
            Akzeptieren
          </Button>
        </div>
      </div>
    </div>
  );
}
