"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Search, MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_PRIMARY, MOBILE_SECONDARY, type NavItem } from "@/lib/nav";

interface MobileTabBarProps {
  isAdmin?: boolean;
}

/**
 * Untere Navigationsleiste fuer Handys. Die Sidebar ist unter md ausgeblendet,
 * ohne diese Leiste gaebe es auf dem Handy gar keine Navigation. Drei feste
 * Ziele plus Suche und ein Mehr-Menue, das entspricht der Empfehlung von
 * drei bis fuenf Eintraegen (Material 3, Apple HIG).
 */
export function MobileTabBar({ isAdmin = false }: MobileTabBarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const secondary = MOBILE_SECONDARY.filter((item) => !item.adminOnly || isAdmin);

  function label(item: NavItem) {
    return item.labelKey ? t(item.labelKey) : item.fallbackLabel;
  }

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  }

  function openCommandPalette() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true }));
  }

  return (
    <>
      {/* Mehr-Menue als Bottom Sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t p-4 pb-safe-4 shadow-2xl"
            style={{ background: "var(--surface-sidebar)", borderColor: "var(--panel-border)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-t1">{t("more")}</span>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label={t("close")}
                className="grid size-11 place-items-center rounded-xl text-t3 transition-colors hover:text-t1 touch-manipulation"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {secondary.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center text-xs font-medium touch-manipulation transition-colors",
                      isActive(item.href) ? "text-indigo-500" : "text-t2"
                    )}
                    style={{ background: "var(--panel-bg-subtle)", border: "1px solid var(--panel-border)" }}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="leading-tight">{label(item)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label={t("mainNavigation")}
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t pb-safe backdrop-blur-xl md:hidden"
        style={{ background: "var(--surface-sidebar)", borderColor: "var(--panel-border)" }}
      >
        {MOBILE_PRIMARY.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium touch-manipulation transition-colors",
                active ? "text-indigo-500" : "text-t3"
              )}
            >
              <Icon className="size-5 shrink-0" />
              <span className="truncate max-w-full">{label(item)}</span>
            </Link>
          );
        })}

        <button
          onClick={openCommandPalette}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium text-t3 touch-manipulation transition-colors"
        >
          <Search className="size-5 shrink-0" />
          <span className="truncate max-w-full">{t("search")}</span>
        </button>

        <button
          onClick={() => setMoreOpen(true)}
          aria-expanded={moreOpen}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium touch-manipulation transition-colors",
            moreOpen ? "text-indigo-500" : "text-t3"
          )}
        >
          <MoreHorizontal className="size-5 shrink-0" />
          <span className="truncate max-w-full">{t("more")}</span>
        </button>
      </nav>
    </>
  );
}
