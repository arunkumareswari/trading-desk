"use client";

import * as React from "react";
import { PanelLeft, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarContextValue {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("sidebar_open");
    if (saved !== null) {
      setIsOpen(saved === "true");
    }
  }, []);

  const toggle = React.useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_open", String(next));
      return next;
    });
  }, []);

  const open = React.useCallback(() => {
    setIsOpen(true);
    localStorage.setItem("sidebar_open", "true");
  }, []);

  const close = React.useCallback(() => {
    setIsOpen(false);
    localStorage.setItem("sidebar_open", "false");
  }, []);

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggle();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { isOpen, toggle } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      className={className ?? "hidden md:flex text-muted-foreground hover:text-foreground"}
      title={isOpen ? "Hide sidebar (Ctrl+B)" : "Show sidebar (Ctrl+B)"}
      aria-label={isOpen ? "Hide sidebar" : "Show sidebar"}
    >
      {isOpen ? (
        <PanelLeftClose className="h-4.5 w-4.5" />
      ) : (
        <PanelLeftOpen className="h-4.5 w-4.5 text-primary" />
      )}
    </Button>
  );
}
