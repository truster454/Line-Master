"use client";

import { cn } from "@/lib/utils";
import {
  type OpeningCategory,
  categoryLabels,
  openings,
} from "@/lib/chess-data";
import {
  KingIcon,
  KnightIcon,
  BishopIcon,
  PawnIcon,
  RookIcon,
  QueenIcon,
} from "./chess-icons";
import { Crosshair } from "lucide-react";

const categoryIcons: Record<
  OpeningCategory,
  React.ComponentType<{ className?: string }>
> = {
  classical: KingIcon,
  gambit: KnightIcon,
  countergambit: BishopIcon,
  hypermodern: QueenIcon,
  system: RookIcon,
  flank: PawnIcon,
  trap: Crosshair,
};

const categoryAccents: Record<OpeningCategory, string> = {
  classical: "from-primary/5 to-transparent border-primary/10 hover:border-primary/30",
  gambit: "from-destructive/5 to-transparent border-destructive/10 hover:border-destructive/30",
  countergambit: "from-sky/5 to-transparent border-sky/10 hover:border-sky/30",
  hypermodern: "from-emerald/5 to-transparent border-emerald/10 hover:border-emerald/30",
  system: "from-muted-foreground/5 to-transparent border-muted-foreground/10 hover:border-muted-foreground/30",
  flank: "from-primary/5 to-transparent border-primary/10 hover:border-primary/20",
  trap: "from-destructive/5 to-transparent border-destructive/10 hover:border-destructive/20",
};

const categoryIconColors: Record<OpeningCategory, string> = {
  classical: "text-primary",
  gambit: "text-destructive",
  countergambit: "text-sky",
  hypermodern: "text-emerald",
  system: "text-muted-foreground",
  flank: "text-primary/70",
  trap: "text-destructive/70",
};

interface CategoryGridProps {
  onSelectCategory: (category: OpeningCategory) => void;
  activeCategory: OpeningCategory | null;
}

export function CategoryGrid({
  onSelectCategory,
  activeCategory,
}: CategoryGridProps) {
  const categories: OpeningCategory[] = [
    "classical",
    "gambit",
    "countergambit",
    "hypermodern",
    "system",
    "flank",
    "trap",
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Категории дебютов</h2>
        {activeCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory(activeCategory)}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {categories.map((cat) => {
          const Icon = categoryIcons[cat];
          const count = openings.filter((o) => o.category === cat).length;
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border bg-gradient-to-b transition-all duration-200 cursor-pointer group",
                categoryAccents[cat],
                isActive && "ring-1 ring-primary/30 scale-[1.02]"
              )}
            >
              <Icon
                className={cn(
                  "w-6 h-6 transition-transform duration-200 group-hover:scale-110",
                  categoryIconColors[cat]
                )}
              />
              <span className="text-xs font-medium text-foreground text-center leading-tight">
                {categoryLabels[cat]}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {count} {count === 1 ? "дебют" : count < 5 ? "дебюта" : "дебютов"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
