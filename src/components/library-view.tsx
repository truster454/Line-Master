"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  type ChessOpening,
  type DifficultyLevel,
  openings as allOpenings,
  categoryLabels,
  difficultyLabels,
  difficultyColors,
} from "@/lib/chess-data";
import { OpeningDetail } from "./opening-detail";
import { Search, Star, Filter } from "lucide-react";

type SortBy = "name" | "popularity" | "difficulty" | "rating";

export function LibraryView() {
  const [openingsData, setOpeningsData] = useState(allOpenings);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("popularity");
  const [selectedOpening, setSelectedOpening] = useState<ChessOpening | null>(null);

  const difficultyOrder: Record<DifficultyLevel, number> = {
    basic: 1,
    "system-based": 2,
    tactical: 3,
    theoretical: 4,
    conceptual: 5,
  };

  const ratingOrder: Record<string, number> = {
    "0-700": 1,
    "700-1000": 2,
    "1000-1300": 3,
    "1300-1600": 4,
    "1600-2000": 5,
    "2000+": 6,
  };

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
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.nameRu.localeCompare(b.nameRu);
        case "popularity":
          return b.popularity - a.popularity;
        case "difficulty":
          return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        case "rating":
          return ratingOrder[a.ratingRange] - ratingOrder[b.ratingRange];
        default:
          return 0;
      }
    });
    return result;
  }, [openingsData, searchQuery, sortBy]);

  const handleToggleFavorite = (id: string) => {
    setOpeningsData((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isFavorite: !o.isFavorite } : o))
    );
    if (selectedOpening?.id === id) {
      setSelectedOpening((prev) =>
        prev ? { ...prev, isFavorite: !prev.isFavorite } : null
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          Библиотека дебютов
        </h1>
        <p className="text-xs text-muted-foreground">
          Полный каталог дебютов с поиском и сортировкой
        </p>
      </div>

      {/* Search and filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск по названию, ECO коду..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {(["popularity", "name", "difficulty", "rating"] as SortBy[]).map(
            (sort) => (
              <button
                key={sort}
                type="button"
                onClick={() => setSortBy(sort)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-all border",
                  sortBy === sort
                    ? "bg-primary/10 text-primary border-primary/20 font-medium"
                    : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/10"
                )}
              >
                {sort === "popularity" && "Популярность"}
                {sort === "name" && "Название"}
                {sort === "difficulty" && "Сложность"}
                {sort === "rating" && "Рейтинг"}
              </button>
            )
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary/30 border-b border-border">
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  ECO
                </th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Дебют
                </th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  Категория
                </th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  Сложность
                </th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Рейтинг
                </th>
                <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  Теория
                </th>
                <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3 w-10">
                  <Star className="w-3 h-3 mx-auto" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((opening, index) => (
                <tr
                  key={opening.id}
                  className={cn(
                    "border-b border-border/50 transition-colors hover:bg-secondary/20 cursor-pointer group",
                    index % 2 === 0 ? "bg-card" : "bg-card/50"
                  )}
                  onClick={() => setSelectedOpening(opening)}
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {opening.eco}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {opening.nameRu}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {opening.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {categoryLabels[opening.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        difficultyColors[opening.difficulty]
                      )}
                    >
                      {difficultyLabels[opening.difficulty]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-xs text-muted-foreground font-mono">
                      {opening.ratingRange}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex gap-0.5 justify-center">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={`lib-depth-${opening.id}-${i}`}
                          className={cn(
                            "w-1 h-2.5 rounded-full",
                            i < opening.theoryDepth
                              ? "bg-primary/50"
                              : "bg-secondary"
                          )}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(opening.id);
                      }}
                      aria-label={opening.isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
                    >
                      <Star
                        className={cn(
                          "w-3.5 h-3.5 mx-auto transition-colors",
                          opening.isFavorite
                            ? "text-primary fill-primary"
                            : "text-muted-foreground/30 hover:text-primary/60"
                        )}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground text-center">
        Показано {filtered.length} из {openingsData.length} дебютов
      </p>

      {selectedOpening && (
        <OpeningDetail
          opening={selectedOpening}
          onClose={() => setSelectedOpening(null)}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}
