"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { type RatingRange, ratingLabels } from "@/lib/chess-data";
import { ChevronRight, Globe, Eye, Info } from "lucide-react";
import type { PerformanceMode } from "@/shared/types";

export function PopupSettings() {
  const [autoDetect, setAutoDetect] = useState(true);
  const [showHints, setShowHints] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>("standard");
  const [selectedRating, setSelectedRating] = useState<RatingRange>("1000-1300");

  useEffect(() => {
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }

    runtime.sendMessage({ type: "hints:get" }, (response) => {
      if (response?.ok) {
        setShowHints(Boolean(response.payload));
      }
    });

    runtime.sendMessage({ type: "performance:get" }, (response) => {
      if (response?.ok && (response.payload === "standard" || response.payload === "economy")) {
        setPerformanceMode(response.payload);
      }
    });
  }, []);

  const toggleHints = () => {
    const next = !showHints;
    setShowHints(next);
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }
    runtime.sendMessage({ type: "hints:set", payload: { enabled: next } });
  };

  const changePerformanceMode = (next: PerformanceMode) => {
    if (next === performanceMode) {
      return;
    }
    setPerformanceMode(next);
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }
    runtime.sendMessage({ type: "performance:set", payload: { mode: next } });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Настройки
        </h3>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-3">
        {/* Rating selector */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-medium text-foreground">Ваш рейтинг</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Определяет глубину и набор дебютов
            </p>
          </div>
          <div className="p-2 flex flex-wrap gap-1.5">
            {(Object.keys(ratingLabels) as RatingRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setSelectedRating(range)}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all",
                  selectedRating === range
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border/30">
            <span className="text-[10px] text-primary font-medium">
              {ratingLabels[selectedRating]}
            </span>
          </div>
        </div>

        {/* Toggle settings */}
        <div className="rounded-xl bg-card border border-border/50 divide-y divide-border/30">
          <ToggleRow
            icon={<Globe className="w-4 h-4" />}
            label="Автоопределение"
            description="Автоматически определять игру на chess.com"
            checked={autoDetect}
            onToggle={() => setAutoDetect(!autoDetect)}
          />
          <ToggleRow
            icon={<Eye className="w-4 h-4" />}
            label="Подсказки ходов"
            description="Показывать рекомендации во время игры"
            checked={showHints}
            onToggle={toggleHints}
          />
        </div>

        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-medium text-foreground">Производительность</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Стандартный режим показывает все ходы, Экономия снижает нагрузку
            </p>
          </div>
          <div className="p-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => changePerformanceMode("standard")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all",
                performanceMode === "standard"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
              )}
            >
              Стандартный
            </button>
            <button
              type="button"
              onClick={() => changePerformanceMode("economy")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all",
                performanceMode === "economy"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
              )}
            >
              Экономия
            </button>
          </div>
          <div className="px-3 py-2 border-t border-border/30">
            <span className="text-[10px] text-primary font-medium">
              {performanceMode === "standard"
                ? "Стандарт: полная частота обновления и все теоретические ходы"
                : "Экономия: реже обновляет позицию и показывает до 3 ходов"}
            </span>
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl bg-card border border-border/50">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-medium text-foreground">lineMaster</span>
              <p className="text-[10px] text-muted-foreground">v0.1.0 beta</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-foreground block">{label}</span>
        <span className="text-[10px] text-muted-foreground">{description}</span>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-9 h-5 rounded-full transition-all duration-200 relative shrink-0",
          checked ? "bg-primary" : "bg-secondary"
        )}
        aria-label={`Toggle ${label}`}
      >
        <div
          className={cn(
            "w-4 h-4 rounded-full bg-background absolute top-0.5 transition-all duration-200 shadow-sm",
            checked ? "left-[18px]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}
