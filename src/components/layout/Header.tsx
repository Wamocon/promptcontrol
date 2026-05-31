"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut,
  Settings,
  ChevronDown,
  Globe,
  Sun,
  Moon,
  Search,
} from "lucide-react";
import { useState } from "react";
import { XpDisplay } from "@/components/gamification/XpDisplay";

interface HeaderProps {
  userName?: string;
  locale: string;
}

export function Header({ userName, locale }: HeaderProps) {
  const t = useTranslations("nav");
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  function switchLocale() {
    const newLocale = locale === "de" ? "en" : "de";
    router.push(`/${newLocale}${pathname}`);
  }

  const isDark = resolvedTheme === "dark";

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 transition-colors"
      style={{
        background: "var(--surface-topbar)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "var(--panel-border)",
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25">
          PC
        </div>
        <span className="hidden font-bold sm:block" style={{ color: "var(--text-1)" }}>
          <span className="text-indigo-500">Pro</span>Con
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-3">
        {/* Command palette trigger */}
        <button
          onClick={() => {
            const evt = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true });
            window.dispatchEvent(evt);
          }}
          className="hidden md:flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/6 magnetic"
          style={{ background: "var(--panel-bg-subtle)", color: "var(--text-3)" }}
          title="Befehlspalette offnen"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Suchen...</span>
          <span className="kbd ml-2">⌘K</span>
        </button>

        {/* Gamification XP/Level/Streak */}
        <XpDisplay />

        <div className="flex items-center gap-1">
        {/* Language switcher */}
        <button
          onClick={switchLocale}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold uppercase transition-colors hover:bg-black/5 dark:hover:bg-white/6"
          style={{ color: "var(--text-3)" }}
          title="Switch language"
        >
          <Globe className="h-3.5 w-3.5" />
          {locale === "de" ? "EN" : "DE"}
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex items-center justify-center rounded-lg p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/6"
          style={{ color: "var(--text-3)" }}
          title={isDark ? "Hellmodus aktivieren" : "Dunkelmodus aktivieren"}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User menu */}
        {userName && (
          <div className="relative ml-1">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/6"
              style={{ color: "var(--text-2)" }}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/25">
                {userName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block">{userName}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div
                  className="absolute right-0 top-11 z-20 w-52 rounded-xl p-1.5 shadow-2xl"
                  style={{
                    background: "var(--surface-topbar)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid var(--panel-border)",
                  }}
                >
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: "var(--text-2)" }}
                  >
                    <Settings className="h-4 w-4" />
                    {t("profileSettings")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </header>
  );
}


