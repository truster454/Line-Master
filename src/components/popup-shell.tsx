"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Star, Settings, Home } from "lucide-react";
import { KingIcon } from "./chess-icons";

export type PopupPage =
  | "home"
  | "library"
  | "categories"
  | "favorites"
  | "settings";

interface PopupShellProps {
  activePage: PopupPage;
  onNavigate: (page: PopupPage) => void;
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
}

const navItems: {
  id: PopupPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "home", label: "Главная", icon: Home },
  { id: "library", label: "Дебюты", icon: BookOpen },
  { id: "favorites", label: "Избранное", icon: Star },
  { id: "settings", label: "Настройки", icon: Settings },
];

export function PopupShell({
  activePage,
  onNavigate,
  children,
  title,
  onBack,
}: PopupShellProps) {
  return (
    <div className="w-[380px] h-[560px] flex flex-col bg-background overflow-hidden relative rounded-xl border border-border">
      {/* Header */}
      {activePage !== "home" && (
        <header className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-sm shrink-0 relative z-10">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0"
              >
                <path
                  d="M10 12L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs">Назад</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center">
                <KingIcon className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground tracking-tight">
                lineMaster
              </span>
            </div>
          )}
          {title && (
            <h1 className="text-sm font-semibold text-foreground ml-auto">
              {title}
            </h1>
          )}
        </header>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">{children}</div>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around px-2 py-2 border-t border-border/50 bg-card/90 backdrop-blur-sm shrink-0 relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_6px_hsl(38_95%_56%/0.5)]")} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn("text-[9px]", isActive && "font-medium")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
