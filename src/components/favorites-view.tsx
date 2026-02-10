"use client";

import { useState } from "react";
import {
  type ChessOpening,
  openings as allOpenings,
} from "@/lib/chess-data";
import { OpeningCard } from "./opening-card";
import { OpeningDetail } from "./opening-detail";
import { Star } from "lucide-react";

export function FavoritesView() {
  const [openingsData, setOpeningsData] = useState(allOpenings);
  const [selectedOpening, setSelectedOpening] = useState<ChessOpening | null>(null);

  const favorites = openingsData.filter((o) => o.isFavorite);

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
          Избранные дебюты
        </h1>
        <p className="text-xs text-muted-foreground">
          Дебюты, которые вы сохранили для быстрого доступа
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-dashed border-border">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-4">
            <Star className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Нет избранных дебютов
          </p>
          <p className="text-xs text-muted-foreground/60">
            Нажмите на звездочку рядом с дебютом, чтобы добавить его сюда
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((opening) => (
            <OpeningCard
              key={opening.id}
              opening={opening}
              onToggleFavorite={handleToggleFavorite}
              onSelect={setSelectedOpening}
            />
          ))}
        </div>
      )}

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
