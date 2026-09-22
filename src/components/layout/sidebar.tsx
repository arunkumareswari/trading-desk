"use client";

import Link from "next/link";
import { NavLinks } from "@/components/layout/nav-links";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { isOpen } = useSidebar();

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen hidden md:flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out z-30",
        isOpen ? "w-60" : "w-16"
      )}
    >
      <div
        className={cn(
          "flex items-center h-16 border-b border-sidebar-border shrink-0 transition-all duration-300",
          isOpen ? "px-5" : "justify-center px-0"
        )}
      >
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Trading Desk Logo"
              className="h-full w-full object-contain"
            />
          </div>
          {isOpen && (
            <span className="font-semibold tracking-tight text-[15px] whitespace-nowrap overflow-hidden transition-opacity duration-200">
              Trading Desk
            </span>
          )}
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <NavLinks collapsed={!isOpen} />
      </div>
    </aside>
  );
}
