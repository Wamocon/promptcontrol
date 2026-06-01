"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutGrid, CreditCard, Users, Settings, Bot, BarChart3 } from "lucide-react";

const TABS = [
  { key: "overview",      href: "/dashboard/admin",               icon: LayoutGrid },
  { key: "subscriptions", href: "/dashboard/admin/subscriptions", icon: CreditCard },
  { key: "users",         href: "/dashboard/admin/users",         icon: Users },
  { key: "settings",      href: "/dashboard/admin/settings",      icon: Settings },
  { key: "aiProviders",   href: "/dashboard/admin/ai-providers",  icon: Bot },
  { key: "stats",         href: "/dashboard/admin/stats",         icon: BarChart3 },
] as const;

export function AdminTabs() {
  const t = useTranslations("admin.tabs");
  const pathname = usePathname();

  return (
    <div className="border-b" style={{ borderColor: "var(--panel-border)" }}>
      <nav className="flex gap-1 overflow-x-auto px-6 -mb-px" aria-label="Admin-Bereiche">
        {TABS.map(({ key, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard/admin"
              ? pathname === "/dashboard/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={key}
              href={href}
              className={`group inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-300"
                  : "border-transparent text-t3 hover:text-t1 hover:border-[color:var(--panel-border-strong)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
