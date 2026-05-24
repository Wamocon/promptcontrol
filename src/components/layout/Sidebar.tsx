"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  ScrollText,
  Users,
  Settings,
  Zap,
  ShieldCheck,
  UserCircle,
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
    { href: "/dashboard/team" as const, label: t("team"), icon: Users },
    { href: "/dashboard/profile" as const, label: t("profile"), icon: UserCircle },
    { href: "/dashboard/settings" as const, label: t("settings"), icon: Settings },
  ];

  return (
    <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:flex md:flex-col">
      <nav className="flex flex-col gap-1 p-3 flex-1">
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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
            <Link
              href="/dashboard/admin"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname.startsWith("/dashboard/admin")
                  ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              )}
            >
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {t("admin")}
            </Link>
          </>
        )}
      </nav>

      {/* Plan badge */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        {plan === "free" ? (
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 px-3 py-2 text-sm dark:from-indigo-900/20 dark:to-purple-900/20"
          >
            <Zap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="font-medium text-indigo-700 dark:text-indigo-300 text-xs">Free Plan</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400">Upgrade to Pro</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm text-white">
            <Zap className="h-4 w-4" />
            <span className="font-medium">Pro Plan</span>
          </div>
        )}
      </div>
    </aside>
  );
}
