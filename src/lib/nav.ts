import {
  LayoutDashboard,
  FolderOpen,
  ScrollText,
  Users,
  ShieldCheck,
  FlaskConical,
  BookOpen,
  Wrench,
  UserCircle,
} from "lucide-react";

export interface NavItem {
  href:
    | "/dashboard"
    | "/dashboard/projects"
    | "/dashboard/skills"
    | "/dashboard/logs"
    | "/dashboard/ab-tests"
    | "/dashboard/team"
    | "/dashboard/mcp-guide"
    | "/dashboard/profile"
    | "/dashboard/admin";
  /** Schluessel im nav-Namespace, oder null wenn das Label fest ist */
  labelKey: string | null;
  fallbackLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  /** Erscheint auf dem Handy in der festen unteren Leiste statt im Mehr-Menue */
  primaryOnMobile?: boolean;
}

/** Eine Quelle fuer Sidebar und mobile Navigation, damit beide nicht auseinanderlaufen. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", fallbackLabel: "Dashboard", icon: LayoutDashboard, primaryOnMobile: true },
  { href: "/dashboard/skills", labelKey: "skills", fallbackLabel: "Skills", icon: Wrench, primaryOnMobile: true },
  { href: "/dashboard/projects", labelKey: "projects", fallbackLabel: "Projekte", icon: FolderOpen, primaryOnMobile: true },
  { href: "/dashboard/logs", labelKey: "logs", fallbackLabel: "Logs", icon: ScrollText },
  { href: "/dashboard/ab-tests", labelKey: null, fallbackLabel: "A/B Tests", icon: FlaskConical },
  { href: "/dashboard/team", labelKey: "team", fallbackLabel: "Team", icon: Users },
  { href: "/dashboard/mcp-guide", labelKey: "mcpGuide", fallbackLabel: "MCP-Anleitung", icon: BookOpen },
  { href: "/dashboard/profile", labelKey: "profile", fallbackLabel: "Mein Profil", icon: UserCircle },
  { href: "/dashboard/admin", labelKey: "admin", fallbackLabel: "Administration", icon: ShieldCheck, adminOnly: true },
];

/** Die drei Ziele, die auf dem Handy fest in der unteren Leiste stehen. */
export const MOBILE_PRIMARY = NAV_ITEMS.filter((i) => i.primaryOnMobile);

/** Alles Weitere landet im Mehr-Menue. */
export const MOBILE_SECONDARY = NAV_ITEMS.filter((i) => !i.primaryOnMobile);
