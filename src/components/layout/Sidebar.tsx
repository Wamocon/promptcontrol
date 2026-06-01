"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  ScrollText,
  Users,
  Zap,
  ShieldCheck,
  FlaskConical,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  plan: "free" | "pro";
  isAdmin?: boolean;
}

export function Sidebar({ plan, isAdmin = false }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard" as const, label: t("dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/projects" as const, label: t("projects"), icon: FolderOpen },
    { href: "/dashboard/logs" as const, label: t("logs"), icon: ScrollText },
    { href: "/dashboard/ab-tests" as const, label: "A/B Tests", icon: FlaskConical },
    { href: "/dashboard/team" as const, label: t("team"), icon: Users },
    { href: "/dashboard/mcp-guide" as const, label: t("mcpGuide"), icon: BookOpen },
  ];

  return (
    <aside
      className="hidden w-60 shrink-0 border-r border-white/6 md:flex md:flex-col"
      style={{ background: "var(--surface-sidebar)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <nav className="flex flex-col gap-0.5 p-3 flex-1 pt-4">
        {/* Section label */}
        <div className="px-3 pb-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-t4">Navigation</span>
        </div>

        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "nav-active ring-1 ring-indigo-500/25"
                  : "text-t3 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-3 border-t" style={{ borderColor: "var(--panel-border)" }} />
            <div className="px-3 pb-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-t4">Admin</span>
            </div>
            <Link
              href="/dashboard/admin"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                pathname.startsWith("/dashboard/admin")
                  ? "bg-rose-500/12 text-rose-500 dark:text-rose-400 ring-1 ring-rose-500/25"
                  : "text-t3 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1"
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {t("admin")}
            </Link>
          </>
        )}
      </nav>

      {/* Plan badge */}
      <div className="p-3 border-t" style={{ borderColor: "var(--panel-border)" }}>
        {plan === "free" ? (
          <Link
            href={{ pathname: "/dashboard/profile", query: { tab: "billing" } }}
            className="flex items-center gap-2.5 rounded-xl border border-indigo-500/20 px-3 py-2.5 text-sm transition-all hover:border-indigo-500/35"
            style={{ background: "rgba(99,102,241,0.07)" }}
          >
            <Zap className="h-4 w-4 text-indigo-500 shrink-0" />
            <div>
              <p className="font-semibold text-indigo-600 dark:text-indigo-400 text-xs">Free Plan</p>
              <p className="text-xs text-t4">Upgrade to Pro</p>
            </div>
          </Link>
        ) : (
          <div
            className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.20) 0%, rgba(168,85,247,0.20) 100%)", border: "1px solid rgba(99,102,241,0.30)" }}
          >
            <Zap className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="font-semibold text-indigo-600 dark:text-indigo-300">Pro Plan</span>
          </div>
        )}
      </div>
    </aside>
  );
}
