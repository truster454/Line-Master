"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  type ChessOpening,
  type OpeningCategory,
  openings as allOpenings,
  categoryLabels,
  categoryDescriptions,
  difficultyLabels,
  difficultyColors,
} from "@/lib/chess-data";
import { Search, ChevronRight, Star, ArrowLeft } from "lucide-react";

interface PopupLibraryProps {
  onNavigateToCategories?: () => void;
}

export function PopupLibrary({ onNavigateToCategories }: PopupLibraryProps) {
  const [openingsData, setOpeningsData] = useState(allOpenings);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<OpeningCategory | null>(null);
  const [selectedOpening, setSelectedOpening] = useState<ChessOpening | null>(null);

  const filtered = useMemo(() => {
    let result = openingsData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.nameRu.toLowerCase().includes(q) ||
          o.eco.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      result = result.filter((o) => o.category === selectedCategory);
    }
    return result.sort((a, b) => b.popularity - a.popularity);
  }, [openingsData, searchQuery, selectedCategory]);

  const handleToggleFavorite = (id: string) => {
    setOpeningsData((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isFavorite: !o.isFavorite } : o))
    );
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Partial<Record<OpeningCategory, number>> = {};
    for (const o of openingsData) {
      counts[o.category] = (counts[o.category] || 0) + 1;
    }
    return counts;
  }, [openingsData]);

  const categoryIcons: Record<OpeningCategory, string> = {
    classical: "/images/decent.png",
    gambit: "/images/brilliant.png",
    countergambit: "/images/great.png",
    hypermodern: "/images/teoretical.png",
    system: "/images/good.png",
    flank: "/images/mistake.png",
    trap: "/images/blunder.png",
  };

  // Opening detail view
  if (selectedOpening) {
    return (
      <div className="flex flex-col h-full animate-fade-in-up">
        <div className="p-4 flex flex-col gap-4">
          <button
            type="button"
            onClick={() => setSelectedOpening(null)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs">Назад к списку</span>
          </button>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {selectedOpening.eco}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {categoryLabels[selectedOpening.category]}
                </span>
              </div>
              <h2 className="text-base font-bold text-foreground">
                {selectedOpening.nameRu}
              </h2>
              <p className="text-xs text-muted-foreground">{selectedOpening.name}</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleFavorite(selectedOpening.id)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="Toggle favorite"
            >
              <Star
                className={cn(
                  "w-5 h-5",
                  selectedOpening.isFavorite
                    ? "text-primary fill-primary"
                    : "text-muted-foreground"
                )}
              />
            </button>
          </div>

          {/* Moves */}
          <div className="px-3 py-2.5 rounded-lg bg-secondary/60 border border-border">
            <p className="text-sm font-mono text-foreground tracking-wide">
              {selectedOpening.moves}
            </p>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            {selectedOpening.descriptionRu}
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                Сложность
              </span>
              <span className={cn("text-sm font-semibold", difficultyColors[selectedOpening.difficulty])}>
                {difficultyLabels[selectedOpening.difficulty]}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                Рейтинг
              </span>
              <span className="text-sm font-semibold text-foreground font-mono">
                {selectedOpening.ratingRange}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                Популярность
              </span>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${selectedOpening.popularity}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-foreground">{selectedOpening.popularity}%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border/50">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider block mb-1">
                Глубина теории
              </span>
              <div className="flex gap-0.5 mt-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={`depth-${selectedOpening.id}-${i}`}
                    className={cn(
                      "w-2 h-3 rounded-sm",
                      i < selectedOpening.theoryDepth ? "bg-primary/70" : "bg-secondary"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Category selection view
  if (!selectedCategory && !searchQuery) {
    return (
      <div className="flex flex-col h-full">
        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск дебютов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-3">
            Категории дебютов
          </h3>
          <div className="flex flex-col gap-2">
            {(Object.keys(categoryLabels) as OpeningCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:bg-card/80 transition-all group text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <img
                    src={categoryIcons[cat] || "/placeholder.svg"}
                    alt={categoryLabels[cat]}
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {categoryLabels[cat]}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {categoryCounts[cat] || 0}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {categoryDescriptions[cat]}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filtered list view
  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск дебютов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>
      </div>

      {/* Selected category header */}
      {selectedCategory && (
        <div className="px-4 pb-2">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="text-xs">Все категории</span>
          </button>
          <h3 className="text-sm font-semibold text-foreground">
            {categoryLabels[selectedCategory]}
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {categoryDescriptions[selectedCategory]}
          </p>
        </div>
      )}

      {/* Opening list */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="flex flex-col gap-1.5">
          {filtered.map((opening) => (
            <div
              key={opening.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedOpening(opening)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedOpening(opening);
                }
              }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  {opening.nameRu}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                  {opening.moves}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(opening.id);
                  }}
                  aria-label="Toggle favorite"
                >
                  <Star
                    className={cn(
                      "w-3.5 h-3.5",
                      opening.isFavorite
                        ? "text-primary fill-primary"
                        : "text-muted-foreground/30 hover:text-primary/60"
                    )}
                  />
                </button>
                <span className="text-[9px] text-muted-foreground font-mono">
                  {opening.ratingRange}
                </span>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="w-8 h-8 mb-2 opacity-30" />
            <span className="text-xs">Ничего не найдено</span>
          </div>
        )}
      </div>
    </div>
  );
}
