"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  FolderOpen,
  ScrollText,
  Users,
  Settings,
  FlaskConical,
  UserCircle,
  ShieldCheck,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  Plus,
  Zap,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "next-themes";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string[];
  group: "navigation" | "actions" | "ai" | "settings";
  onSelect: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  locale: string;
}

export function CommandPalette({ locale }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global keyboard shortcut Cmd/Ctrl+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIdx(0);
    } else {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const nav = (path: string) => {
    router.push(`/${locale}${path}`);
    setOpen(false);
  };

  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      { id: "nav-dashboard", label: "Dashboard", icon: LayoutDashboard, group: "navigation", shortcut: ["g", "d"], onSelect: () => nav("/dashboard"), keywords: "home start übersicht" },
      { id: "nav-projects", label: "Projekte", icon: FolderOpen, group: "navigation", shortcut: ["g", "p"], onSelect: () => nav("/dashboard/projects"), keywords: "prompts ordner" },
      { id: "nav-logs", label: "Logs", icon: ScrollText, group: "navigation", shortcut: ["g", "l"], onSelect: () => nav("/dashboard/logs"), keywords: "api aufrufe history" },
      { id: "nav-abtests", label: "A/B Tests", icon: FlaskConical, group: "navigation", onSelect: () => nav("/dashboard/ab-tests"), keywords: "vergleich variante experiment" },
      { id: "nav-team", label: "Team", icon: Users, group: "navigation", shortcut: ["g", "t"], onSelect: () => nav("/dashboard/team"), keywords: "mitglieder einladen rollen" },
      { id: "nav-profile", label: "Mein Profil", icon: UserCircle, group: "navigation", onSelect: () => nav("/dashboard/profile") },
      { id: "nav-settings", label: "Einstellungen", icon: Settings, group: "navigation", shortcut: ["g", "s"], onSelect: () => nav("/dashboard/settings") },
      { id: "nav-admin", label: "Administration", icon: ShieldCheck, group: "navigation", onSelect: () => nav("/dashboard/admin"), keywords: "admin verwaltung" },

      // Actions
      { id: "act-new-project", label: "Neues Projekt erstellen", icon: Plus, group: "actions", shortcut: ["n", "p"], onSelect: () => nav("/dashboard/projects?new=1"), keywords: "anlegen create" },
      { id: "act-new-prompt", label: "Neuer Prompt", icon: Plus, group: "actions", shortcut: ["n", "n"], onSelect: () => nav("/dashboard/projects?newPrompt=1") },
      { id: "act-invite", label: "Team-Mitglied einladen", icon: Users, group: "actions", onSelect: () => nav("/dashboard/team?invite=1") },

      // AI
      { id: "ai-guide", label: "ProCon Guide öffnen", description: "KI-Assistent für alle Fragen", icon: Sparkles, group: "ai", shortcut: ["?"], onSelect: () => { setOpen(false); window.dispatchEvent(new CustomEvent("procon:open-guide")); }, keywords: "chat hilfe assistent" },

      // Settings
      { id: "set-theme-light", label: "Hellmodus aktivieren", icon: Sun, group: "settings", onSelect: () => { setTheme("light"); setOpen(false); }, keywords: "light theme bright" },
      { id: "set-theme-dark", label: "Dunkelmodus aktivieren", icon: Moon, group: "settings", onSelect: () => { setTheme("dark"); setOpen(false); }, keywords: "dark theme night" },
      { id: "set-theme-toggle", label: `Wechseln zu ${resolvedTheme === "dark" ? "Hellmodus" : "Dunkelmodus"}`, icon: resolvedTheme === "dark" ? Sun : Moon, group: "settings", shortcut: ["t"], onSelect: () => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); setOpen(false); } },
      { id: "set-logout", label: "Abmelden", icon: LogOut, group: "settings", onSelect: async () => { const { createClient } = await import("@/lib/supabase/client"); await createClient().auth.signOut(); router.push(`/${locale}/auth/login`); setOpen(false); } },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, resolvedTheme]
  );

  // Fuzzy filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const haystack = `${c.label} ${c.description ?? ""} ${c.keywords ?? ""} ${c.group}`.toLowerCase();
      return q.split(/\s+/).every((token) => haystack.includes(token));
    });
  }, [query, commands]);

  // Group items
  const groups = useMemo(() => {
    const result: Record<string, CommandItem[]> = {};
    for (const c of filtered) {
      if (!result[c.group]) result[c.group] = [];
      result[c.group].push(c);
    }
    return result;
  }, [filtered]);

  const flatList = filtered;

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  // Keyboard nav within palette
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, flatList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      flatList[activeIdx]?.onSelect();
    }
  }

  // Scroll active item into view
  useEffect(() => {
    const node = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
    node?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  if (!open) return null;

  const groupLabels: Record<string, string> = {
    navigation: "Navigation",
    actions: "Aktionen",
    ai: "KI",
    settings: "Einstellungen",
  };

  let globalIdx = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fade-in-up" />

      {/* Palette */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden gradient-border"
        style={{ animation: "slide-up 0.22s cubic-bezier(0.22, 1, 0.36, 1) both" }}
      >
        <div className="glass-card rounded-2xl">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: "var(--panel-border)" }}>
            <Search className="h-4 w-4 text-indigo-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Suche Aktionen, Seiten, Einstellungen..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
              style={{ color: "var(--text-1)" }}
            />
            <span className="kbd">ESC</span>
          </div>

          {/* List */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
            {flatList.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Zap className="h-6 w-6 mx-auto mb-2 text-indigo-500 opacity-50" />
                <p className="text-sm" style={{ color: "var(--text-3)" }}>
                  Keine Treffer fur <span className="font-semibold">&quot;{query}&quot;</span>
                </p>
              </div>
            ) : (
              Object.entries(groups).map(([group, items]) => (
                <div key={group} className="mb-1">
                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-4)" }}>
                    {groupLabels[group] ?? group}
                  </div>
                  {items.map((item) => {
                    globalIdx += 1;
                    const idx = globalIdx;
                    const active = idx === activeIdx;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        data-idx={idx}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => item.onSelect()}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          active ? "bg-indigo-500/12" : ""
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-all ${
                            active ? "bg-indigo-500/20 text-indigo-500 scale-110" : ""
                          }`}
                          style={!active ? { background: "var(--panel-bg-subtle)", color: "var(--text-3)" } : {}}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: active ? "var(--text-1)" : "var(--text-2)" }}>
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="text-xs truncate" style={{ color: "var(--text-4)" }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.shortcut && (
                          <div className="flex items-center gap-1 shrink-0">
                            {item.shortcut.map((k, i) => (
                              <span key={i} className="kbd">{k}</span>
                            ))}
                          </div>
                        )}
                        {active && <ChevronRight className="h-3.5 w-3.5 text-indigo-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between gap-3 px-4 py-2 border-t text-xs"
            style={{ borderColor: "var(--panel-border)", color: "var(--text-4)" }}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="kbd">↑↓</span> Navigieren</span>
              <span className="flex items-center gap-1.5"><span className="kbd">↵</span> Auswahlen</span>
            </div>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-indigo-500" />
              ProCon Quick Actions
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
