import {
  CalendarRange,
  LayoutDashboard,
  LineChart,
  NotebookPen,
  Settings,
  Wallet,
} from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/journal", label: "Trading Journal", icon: NotebookPen },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/calendar", label: "Calendar", icon: CalendarRange },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
