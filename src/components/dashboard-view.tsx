"use client";

import { useState, useMemo } from "react";
import { type OpeningCategory, type RatingRange, type ChessOpening, openings as allOpenings } from "@/lib/chess-data";
import { StatCards } from "./stat-cards";
import { CategoryGrid } from "./category-grid";
import { RatingSelector } from "./rating-selector";
import { OpeningCard } from "./opening-card";
import { OpeningDetail } from "./opening-detail";

export function DashboardView() {
  const [openingsData, setOpeningsData] = useState(allOpenings);
  const [activeCategory, setActiveCategory] = useState<OpeningCategory | null>(null);
  const [activeRating, setActiveRating] = useState<RatingRange | null>(null);
  const [selectedOpening, setSelectedOpening] = useState<ChessOpening | null>(null);

  const filteredOpenings = useMemo(() => {
    let filtered = openingsData;
    if (activeCategory) {
      filtered = filtered.filter((o) => o.category === activeCategory);
    }
    if (activeRating) {
      filtered = filtered.filter((o) => o.ratingRange === activeRating);
    }
    return filtered;
  }, [openingsData, activeCategory, activeRating]);

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

  const handleCategoryToggle = (cat: OpeningCategory) => {
    setActiveCategory((prev) => (prev === cat ? null : cat));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          Обзор дебютов
        </h1>
        <p className="text-xs text-muted-foreground">
          Ваш персональный справочник по шахматной теории
        </p>
      </div>

      {/* Stats */}
      <StatCards />

      {/* Categories */}
      <CategoryGrid
        onSelectCategory={handleCategoryToggle}
        activeCategory={activeCategory}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Openings grid */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Дебюты
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {filteredOpenings.length} из {openingsData.length}
              </span>
            </h2>
          </div>

          {filteredOpenings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-border">
              <p className="text-sm text-muted-foreground">
                Нет дебютов по выбранным фильтрам
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory(null);
                  setActiveRating(null);
                }}
                className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOpenings.map((opening) => (
                <OpeningCard
                  key={opening.id}
                  opening={opening}
                  onToggleFavorite={handleToggleFavorite}
                  onSelect={setSelectedOpening}
                />
              ))}
            </div>
          )}
        </div>

        {/* Rating sidebar */}
        <div className="order-first lg:order-last">
          <RatingSelector
            activeRating={activeRating}
            onSelectRating={setActiveRating}
          />
        </div>
      </div>

      {/* Detail modal */}
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
