import {
  BookOpen,
  CalendarCheck,
  ChartNoAxesColumn,
  House,
  Layers,
  MessageCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  exact?: boolean;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/app", label: "Overview", shortLabel: "Home", icon: House, exact: true },
  { href: "/app/tutor", label: "AI Tutor", shortLabel: "Tutor", icon: MessageCircle },
  { href: "/app/learning", label: "My Learning", shortLabel: "Learn", icon: BookOpen },
  { href: "/app/planner", label: "Study Planner", shortLabel: "Plan", icon: CalendarCheck },
  { href: "/app/revision", label: "Revision", shortLabel: "Revise", icon: Layers },
  { href: "/app/progress", label: "Progress", shortLabel: "Progress", icon: ChartNoAxesColumn },
];

export const SETTINGS_NAV: NavItem = {
  href: "/app/settings",
  label: "Settings",
  shortLabel: "Settings",
  icon: Settings,
};

/** Bottom bar on mobile: the four most-used destinations; the rest live in the menu. */
export const BOTTOM_NAV: NavItem[] = PRIMARY_NAV.slice(0, 4);

export function isActive(pathname: string | null, item: NavItem): boolean {
  if (!pathname) return false;
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
