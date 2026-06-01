import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "de"],
  defaultLocale: "de",
  pathnames: {
    "/": "/",
    "/dashboard": "/dashboard",
    "/dashboard/projects": "/dashboard/projects",
    "/dashboard/logs": "/dashboard/logs",
    "/dashboard/team": "/dashboard/team",
    "/dashboard/settings": "/dashboard/settings",
    "/dashboard/profile": "/dashboard/profile",
    "/dashboard/admin": "/dashboard/admin",
    "/dashboard/admin/users": "/dashboard/admin/users",
    "/dashboard/admin/subscriptions": "/dashboard/admin/subscriptions",
    "/dashboard/admin/settings": "/dashboard/admin/settings",
    "/dashboard/admin/ai-providers": "/dashboard/admin/ai-providers",
    "/dashboard/admin/stats": "/dashboard/admin/stats",
    "/auth/login": "/auth/login",
    "/auth/register": "/auth/register",
    "/legal/impressum": "/legal/impressum",
    "/legal/datenschutz": "/legal/datenschutz",
    "/legal/agb": "/legal/agb",
    "/dashboard/projects/[id]": "/dashboard/projects/[id]",
    "/dashboard/ab-tests": "/dashboard/ab-tests",
    "/dashboard/mcp-guide": "/dashboard/mcp-guide",
  },
});
