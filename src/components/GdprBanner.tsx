"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "./ui/Button";

export function GdprBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem("pc-gdpr-consent");
  });

  function accept() {
    localStorage.setItem("pc-gdpr-consent", "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem("pc-gdpr-consent", "declined");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm">
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Cookie-Einstellungen</p>
          <button onClick={decline} className="ml-2 text-zinc-400 hover:text-zinc-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
          Wir verwenden notwendige Cookies für den Betrieb dieser Plattform. Durch die Nutzung stimmen Sie unserer{" "}
          <Link href="/legal/datenschutz" className="underline text-indigo-600">Datenschutzerklärung</Link> zu.
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
