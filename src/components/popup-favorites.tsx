"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  openings as allOpenings,
  difficultyLabels,
  difficultyColors,
} from "@/lib/chess-data";
import { Star, Heart } from "lucide-react";

export function PopupFavorites() {
  const [openingsData, setOpeningsData] = useState(allOpenings);

  const favorites = openingsData.filter((o) => o.isFavorite);

  const handleToggleFavorite = (id: string) => {
    setOpeningsData((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isFavorite: !o.isFavorite } : o))
    );
  };

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <div className="w-16 h-16 rounded-full bg-primary/8 flex items-center justify-center mb-4">
          <Heart className="w-7 h-7 text-primary/40" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">
          Нет избранных дебютов
        </h3>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          Добавляйте дебюты в избранное, нажимая на звездочку в библиотеке
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Избранные дебюты ({favorites.length})
        </h3>
      </div>
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="flex flex-col gap-1.5">
          {favorites.map((opening) => (
            <div
              key={opening.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 group"
            >
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">
                    {opening.eco}
                  </span>
                  <span className={cn("text-[9px] font-medium", difficultyColors[opening.difficulty])}>
                    {difficultyLabels[opening.difficulty]}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground truncate">
                  {opening.nameRu}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {opening.moves}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleFavorite(opening.id)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Remove from favorites"
              >
                <Star className="w-4 h-4 text-primary fill-primary" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
