"use client";

import { cn } from "@/lib/utils";
import {
  type ChessOpening,
  categoryLabels,
  difficultyLabels,
  difficultyColors,
} from "@/lib/chess-data";
import { Star, ArrowUpRight, BookOpen } from "lucide-react";

interface OpeningCardProps {
  opening: ChessOpening;
  onToggleFavorite: (id: string) => void;
  onSelect: (opening: ChessOpening) => void;
}

export function OpeningCard({
  opening,
  onToggleFavorite,
  onSelect,
}: OpeningCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 p-4 rounded-xl border border-border bg-card transition-all duration-200",
        "hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 cursor-pointer"
      )}
      onClick={() => onSelect(opening)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect(opening);
      }}
      role="button"
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
              {opening.eco}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {categoryLabels[opening.category]}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-foreground truncate">
            {opening.nameRu}
          </h3>
          <p className="text-xs text-muted-foreground">{opening.name}</p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(opening.id);
          }}
          className="shrink-0 p-1.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label={opening.isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
        >
          <Star
            className={cn(
              "w-4 h-4 transition-colors",
              opening.isFavorite
                ? "text-primary fill-primary"
                : "text-muted-foreground/40 hover:text-primary/60"
            )}
          />
        </button>
      </div>

      {/* Moves */}
      <div className="px-3 py-2 rounded-lg bg-secondary/50 border border-border">
        <p className="text-xs font-mono text-foreground/80 tracking-wide">
          {opening.moves}
        </p>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
        {opening.descriptionRu}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-[10px] font-medium",
              difficultyColors[opening.difficulty]
            )}
          >
            {difficultyLabels[opening.difficulty]}
          </span>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground">
              {opening.ratingRange}
            </span>
          </div>
        </div>

        {/* Theory depth indicator */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground mr-1">Теория</span>
          <div className="flex gap-0.5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`depth-${opening.id}-${i}`}
                className={cn(
                  "w-1 h-3 rounded-full transition-colors",
                  i < opening.theoryDepth
                    ? "bg-primary/60"
                    : "bg-secondary"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hover arrow */}
      <div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
      </div>
    </div>
  );
}
