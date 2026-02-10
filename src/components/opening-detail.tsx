"use client";

import { cn } from "@/lib/utils";
import {
  type ChessOpening,
  categoryLabels,
  difficultyLabels,
  difficultyColors,
  categoryDescriptions,
  ratingLabels,
} from "@/lib/chess-data";
import { Star, X, BookOpen, Zap, Target, TrendingUp } from "lucide-react";

interface OpeningDetailProps {
  opening: ChessOpening;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
}

export function OpeningDetail({
  opening,
  onClose,
  onToggleFavorite,
}: OpeningDetailProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl shadow-primary/5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-label={opening.nameRu}
      >
        {/* Decorative header background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/5 to-transparent rounded-t-2xl" />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative flex flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-md font-semibold">
                {opening.eco}
              </span>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                {categoryLabels[opening.category]}
              </span>
              <span
                className={cn(
                  "text-xs px-2 py-1 rounded-md bg-secondary",
                  difficultyColors[opening.difficulty]
                )}
              >
                {difficultyLabels[opening.difficulty]}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight text-balance">
                  {opening.nameRu}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {opening.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleFavorite(opening.id)}
                className={cn(
                  "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all",
                  opening.isFavorite
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:border-primary/20"
                )}
              >
                <Star
                  className={cn(
                    "w-3.5 h-3.5",
                    opening.isFavorite && "fill-primary"
                  )}
                />
                {opening.isFavorite ? "В избранном" : "Добавить"}
              </button>
            </div>
          </div>

          {/* Main line */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Основная линия
            </h3>
            <div className="px-4 py-3 rounded-xl bg-secondary/50 border border-border font-mono">
              <p className="text-sm text-foreground tracking-wide leading-relaxed">
                {opening.moves}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Описание
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {opening.descriptionRu}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Рейтинг
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {opening.ratingRange}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {ratingLabels[opening.ratingRange]}
              </p>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-sky" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Глубина
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {opening.theoryDepth}/10
              </p>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={`detail-depth-${i}`}
                    className={cn(
                      "w-full h-1 rounded-full",
                      i < opening.theoryDepth ? "bg-primary/60" : "bg-secondary"
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Популярность
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {opening.popularity}%
              </p>
              <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${opening.popularity}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Категория
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {categoryLabels[opening.category]}
              </p>
              <p className="text-[10px] text-muted-foreground line-clamp-2">
                {categoryDescriptions[opening.category]}
              </p>
            </div>
          </div>

          {/* Placeholder for future features */}
          <div className="flex flex-col gap-2 p-4 rounded-xl border border-dashed border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Анализ вариантов и комментарии будут доступны в следующем обновлении
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
