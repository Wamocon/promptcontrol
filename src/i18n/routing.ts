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
    "/auth/login": "/auth/login",
    "/auth/register": "/auth/register",
    "/legal/impressum": "/legal/impressum",
    "/legal/datenschutz": "/legal/datenschutz",
    "/legal/agb": "/legal/agb",
    "/dashboard/projects/[id]": "/dashboard/projects/[id]",
  },
});
