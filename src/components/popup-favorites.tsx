"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import openingsJson from "@/data/openings.json";
import booksIndexJson from "@/data/books.index.json";
import classificationRaw from "@/data/openings.classification.txt?raw";
import { Heart, Star } from "lucide-react";
import type { Opening } from "@/core/openings/schema";
import type { RatingRange } from "@/shared/types";
import { usePopupLanguage } from "./popup-language";

const RATING_ORDER: RatingRange[] = ["0-700", "700-1000", "1000-1300", "1300-1600", "1600-2000", "2000+"];

function normalizeRating(raw: string): string {
  return raw.replace(/-/g, "–").replace(/\s+/g, "");
}

function normalizeOpeningColor(input?: string): "white" | "black" | "unknown" {
  const normalized = (input ?? "").trim().toLowerCase();
  if (["white", "w", "белые", "белые."].includes(normalized)) {
    return "white";
  }
  if (["black", "b", "черные", "чёрные", "черные.", "чёрные."].includes(normalized)) {
    return "black";
  }
  return "unknown";
}

function classificationValueToRatingBand(value: string): RatingRange | null {
  const normalized = value.replace(/–/g, "-").replace(/\s+/g, "");
  return (RATING_ORDER as string[]).includes(normalized) ? (normalized as RatingRange) : null;
}

function isAllowedBySelectedRating(openingRating: string, selectedRating: RatingRange): boolean {
  const openingBand = classificationValueToRatingBand(openingRating);
  if (!openingBand) {
    return true;
  }
  const openingRank = RATING_ORDER.indexOf(openingBand);
  const selectedRank = RATING_ORDER.indexOf(selectedRating);
  if (openingRank === -1 || selectedRank === -1) {
    return true;
  }
  return openingRank <= selectedRank;
}

function buildMetaByOpeningId(): {
  ruByOpeningId: Map<string, string>;
  ratingByOpeningId: Map<string, string>;
  colorByOpeningId: Map<string, "white" | "black" | "unknown">;
} {
  const booksIndex = booksIndexJson as Record<string, string>;
  const ruByBookFile = new Map<string, string>();
  const ratingByBookFile = new Map<string, string>();
  const colorByBookFile = new Map<string, "white" | "black" | "unknown">();

  for (const rawLine of classificationRaw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const match = line.match(/^(\S+)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+?)(?:\s{2,}(.+))?$/);
    if (!match) {
      continue;
    }
    ruByBookFile.set(match[1], match[2]);
    ratingByBookFile.set(match[1], normalizeRating(match[3]));
    colorByBookFile.set(match[1], normalizeOpeningColor(match[6]));
  }

  const ruByOpeningId = new Map<string, string>();
  const ratingByOpeningId = new Map<string, string>();
  const colorByOpeningId = new Map<string, "white" | "black" | "unknown">();
  for (const [openingId, path] of Object.entries(booksIndex)) {
    const bookFile = path.split("/").pop() ?? "";
    const ruName = ruByBookFile.get(bookFile);
    if (ruName) {
      ruByOpeningId.set(openingId, ruName);
    }
    const rating = ratingByBookFile.get(bookFile);
    if (rating) {
      ratingByOpeningId.set(openingId, rating);
    }
    const color = colorByBookFile.get(bookFile);
    if (color) {
      colorByOpeningId.set(openingId, color);
    }
  }

  return { ruByOpeningId, ratingByOpeningId, colorByOpeningId };
}

const OPENINGS = openingsJson as Opening[];
const OPENING_BY_ID = new Map(OPENINGS.map((opening) => [opening.id, opening]));
const {
  ruByOpeningId: RU_NAME_BY_OPENING_ID,
  ratingByOpeningId: RATING_BY_OPENING_ID,
  colorByOpeningId: COLOR_BY_OPENING_ID,
} = buildMetaByOpeningId();
const FAVORITES_STORAGE_KEY = "favorites";

async function loadFavoritesFromStorage(): Promise<string[]> {
  const storage = globalThis.chrome?.storage?.local;
  if (!storage?.get) {
    return [];
  }
  const result = await storage.get(FAVORITES_STORAGE_KEY);
  const raw = result[FAVORITES_STORAGE_KEY];
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

export function PopupFavorites() {
  const { language } = usePopupLanguage();
  const isRu = language === "ru";
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedRatingRange, setSelectedRatingRange] = useState<RatingRange>("1000-1300");
  const [limitsDisabled, setLimitsDisabled] = useState(false);
  const [showOutOfRating, setShowOutOfRating] = useState(true);

  useEffect(() => {
    const runtime = globalThis.chrome?.runtime;
    const storage = globalThis.chrome?.storage;

    void loadFavoritesFromStorage().then((ids) => {
      setFavoriteIds(ids);
    });

    if (runtime?.sendMessage) {
      runtime.sendMessage({ type: "favorites:list" }, (response) => {
        if (globalThis.chrome?.runtime?.lastError) {
          return;
        }
        if (!response?.ok || !Array.isArray(response.payload)) {
          return;
        }
        setFavoriteIds(response.payload as string[]);
      });

      runtime.sendMessage({ type: "settings:get" }, (response) => {
        if (globalThis.chrome?.runtime?.lastError) {
          return;
        }
        if (!response?.ok || !response.payload) {
          return;
        }
        const payload = response.payload as { ratingRange?: RatingRange; limitsDisabled?: boolean };
        if (payload.ratingRange) {
          setSelectedRatingRange(payload.ratingRange);
        }
        setLimitsDisabled(Boolean(payload.limitsDisabled));
      });
    }

    const onMessage = (message: unknown) => {
      const payload = message as {
        type?: string;
        payload?: string[] | { ratingRange?: RatingRange; limitsDisabled?: boolean };
      };
      if (payload.type === "favorites:state" && Array.isArray(payload.payload)) {
        setFavoriteIds(payload.payload);
      }
      if (payload.type === "settings:state" && payload.payload && !Array.isArray(payload.payload)) {
        if (payload.payload.ratingRange) {
          setSelectedRatingRange(payload.payload.ratingRange);
        }
        setLimitsDisabled(Boolean(payload.payload.limitsDisabled));
      }
    };

    if (runtime?.onMessage) {
      runtime.onMessage.addListener(onMessage);
    }

    const onStorageChanged = (changes: Record<string, chrome.storage.StorageChange>, areaName: string) => {
      if (areaName !== "local") {
        return;
      }
      const next = changes[FAVORITES_STORAGE_KEY]?.newValue;
      if (!Array.isArray(next)) {
        return;
      }
      setFavoriteIds(next.filter((item): item is string => typeof item === "string"));
    };

    if (storage?.onChanged) {
      storage.onChanged.addListener(onStorageChanged);
    }

    return () => {
      if (runtime?.onMessage) {
        runtime.onMessage.removeListener(onMessage);
      }
      if (storage?.onChanged) {
        storage.onChanged.removeListener(onStorageChanged);
      }
    };
  }, []);

  const favorites = useMemo(() => {
    return favoriteIds.map((id) => {
      const opening = OPENING_BY_ID.get(id);
      const ruName = RU_NAME_BY_OPENING_ID.get(id);
      const openingRating = RATING_BY_OPENING_ID.get(id);
      const isOutOfRating =
        !limitsDisabled &&
        Boolean(openingRating) &&
        !isAllowedBySelectedRating(openingRating ?? "", selectedRatingRange);
      return {
        id,
        eco: opening?.eco ?? "—",
        name: isRu ? (ruName ?? opening?.name ?? id) : (opening?.name ?? ruName ?? id),
        ratingRange: openingRating ?? "—",
        openingColor: COLOR_BY_OPENING_ID.get(id) ?? "unknown",
        isOutOfRating,
        movesPreview: opening?.moves?.slice(0, 8).join(" ") ?? (isRu ? "Линия не хранится в metadata" : "Line is not stored in metadata"),
      };
    });
  }, [favoriteIds, selectedRatingRange, limitsDisabled, isRu]);

  const visibleFavorites = useMemo(() => {
    if (showOutOfRating) {
      return favorites;
    }
    return favorites.filter((item) => !item.isOutOfRating);
  }, [favorites, showOutOfRating]);

  const whiteFavorites = useMemo(
    () => visibleFavorites.filter((item) => item.openingColor === "white"),
    [visibleFavorites]
  );
  const blackFavorites = useMemo(
    () => visibleFavorites.filter((item) => item.openingColor === "black"),
    [visibleFavorites]
  );
  const unknownFavorites = useMemo(
    () => visibleFavorites.filter((item) => item.openingColor === "unknown"),
    [visibleFavorites]
  );

  const handleRemoveFavorite = (id: string) => {
    setFavoriteIds((prev) => prev.filter((item) => item !== id));
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }
    try {
      runtime.sendMessage({ type: "favorites:remove", payload: { id } });
    } catch {
      // popup closed or extension reloaded
    }
  };

  if (visibleFavorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12">
        <div className="w-16 h-16 rounded-full bg-primary/8 flex items-center justify-center mb-4">
          <Heart className="w-7 h-7 text-primary/40" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{isRu ? "Нет избранных дебютов" : "No favorite openings"}</h3>
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          {isRu
            ? "Добавляйте дебюты в избранное, нажимая на звездочку в библиотеке"
            : "Add openings to favorites by tapping the star in the library"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          {(isRu ? "Избранные дебюты" : "Favorite openings")} ({visibleFavorites.length})
        </h3>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-border/50 bg-card/70 px-2.5 py-2">
          <span className="text-[10px] text-muted-foreground">{isRu ? "Показывать не по рейтингу" : "Show out-of-rating"}</span>
          <button
            type="button"
            onClick={() => setShowOutOfRating((prev) => !prev)}
            className={cn(
              "w-9 h-5 rounded-full transition-all duration-200 relative",
              showOutOfRating ? "bg-primary" : "bg-secondary"
            )}
            aria-label={isRu ? "Показывать не по рейтингу" : "Show out-of-rating"}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full bg-background absolute top-0.5 transition-all duration-200 shadow-sm",
                showOutOfRating ? "left-[18px]" : "left-0.5"
              )}
            />
          </button>
        </div>
      </div>
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="flex flex-col gap-3">
          <FavoritesGroup title={isRu ? "Белые" : "White"} items={whiteFavorites} onRemove={handleRemoveFavorite} language={language} />
          <FavoritesGroup title={isRu ? "Чёрные" : "Black"} items={blackFavorites} onRemove={handleRemoveFavorite} language={language} />
          {unknownFavorites.length > 0 && (
            <FavoritesGroup title={isRu ? "Без цвета" : "Unknown"} items={unknownFavorites} onRemove={handleRemoveFavorite} language={language} />
          )}
        </div>
      </div>
    </div>
  );
}

function FavoritesGroup({
  title,
  language,
  items,
  onRemove,
}: {
  title: string;
  language: "en" | "ru";
  items: Array<{
    id: string;
    eco: string;
    name: string;
    movesPreview: string;
    isOutOfRating: boolean;
  }>;
  onRemove: (id: string) => void;
}) {
  const isRu = language === "ru";
  return (
    <div>
      <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
        {title} ({items.length})
      </h4>
      {items.length === 0 ? (
        <div className="p-3 rounded-xl bg-card border border-border/40">
          <span className="text-[10px] text-muted-foreground">{isRu ? "Пусто" : "Empty"}</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((opening) => (
            <div
              key={opening.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl bg-card border group",
                opening.isOutOfRating ? "border-destructive/60 bg-destructive/10" : "border-border/50"
              )}
            >
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">{opening.eco}</span>
                  {opening.isOutOfRating && (
                    <span className="text-[9px] font-medium text-destructive">{isRu ? "не по рейтингу" : "out of rating"}</span>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground truncate">{opening.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">{opening.movesPreview}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(opening.id)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                aria-label={isRu ? "Удалить из избранного" : "Remove from favorites"}
              >
                <Star className="w-4 h-4 text-primary fill-primary" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
