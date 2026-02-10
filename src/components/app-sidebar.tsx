"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { KingIcon, KnightIcon, BishopIcon, PawnIcon } from "./chess-icons";
import {
  Search,
  LayoutDashboard,
  BookOpen,
  Star,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type NavPage =
  | "dashboard"
  | "library"
  | "favorites"
  | "analytics"
  | "settings";

interface AppSidebarProps {
  activePage: NavPage;
  onNavigate: (page: NavPage) => void;
}

const navItems: {
  id: NavPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "dashboard", label: "Обзор", icon: LayoutDashboard },
  { id: "library", label: "Библиотека", icon: BookOpen },
  { id: "favorites", label: "Избранное", icon: Star },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "settings", label: "Настройки", icon: Settings },
];

export function AppSidebar({ activePage, onNavigate }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
          <KingIcon className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold text-foreground tracking-tight">
              lineMaster
            </span>
            <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
              Opening Theory
            </span>
          </div>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-muted-foreground text-xs">
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span>Поиск дебютов...</span>
            <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
              /
            </kbd>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3 py-3">
        <span
          className={cn(
            "text-[10px] font-medium text-muted-foreground tracking-widest uppercase mb-2",
            collapsed && "text-center"
          )}
        >
          {collapsed ? "---" : "Навигация"}
        </span>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 group",
                collapsed && "justify-center px-2",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Decorative chess pieces */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-muted-foreground/30">
              <KnightIcon className="w-4 h-4" />
              <BishopIcon className="w-4 h-4" />
              <PawnIcon className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-muted-foreground/40 font-mono">
              v0.1.0
            </span>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </aside>
  );
}
