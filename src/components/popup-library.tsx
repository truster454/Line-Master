"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import openingsJson from "@/data/openings.json";
import booksIndexJson from "@/data/books.index.json";
import booksSecondIndexJson from "@/data/books.second.index.json";
import classificationRaw from "@/data/openings.classification.txt?raw";
import { ArrowLeft, ChevronRight, Search, Star } from "lucide-react";
import type { Opening } from "@/core/openings/schema";

type CategoryKey =
  | "classical"
  | "gambit"
  | "countergambit"
  | "hypermodern"
  | "system"
  | "flank"
  | "trap";

type LibraryTab = "general" | "second";

interface LibraryOpening {
  id: string;
  bookFile: string;
  preset: LibraryTab;
  nameRu: string;
  nameEn: string;
  category: CategoryKey;
  ratingRange: string;
  difficultyKey: string;
  movesPreview?: string;
}

const CATEGORY_ORDER: CategoryKey[] = [
  "classical",
  "gambit",
  "countergambit",
  "hypermodern",
  "system",
  "flank",
  "trap",
];

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  classical: "Классические дебюты",
  gambit: "Гамбиты",
  countergambit: "Контргамбиты",
  hypermodern: "Гипермодерн",
  system: "Системные дебюты",
  flank: "Фланговые дебюты",
  trap: "Ловушки",
};

const CATEGORY_DESCRIPTIONS: Record<CategoryKey, string> = {
  classical: "Минимальный риск, борьба за центр, медленное развитие, позиционная игра.",
  gambit: "Ранняя жертва материала за компенсацию. Быстрая и острая игра.",
  countergambit: "Ответ на гамбит или активный ответ на тихий дебют.",
  hypermodern: "Непрямая оккупация центра, акцент на контригру.",
  system: "Почти одинаковая расстановка независимо от ходов соперника.",
  flank: "Нетипичные позиции, расчет на незнакомство соперника.",
  trap: "Попытка поймать соперника на конкретную ошибку.",
};

const CATEGORY_ICON_BY_KEY: Record<CategoryKey, string> = {
  classical: "/images/best.png",
  gambit: "/images/brilliant.png",
  countergambit: "/images/great.png",
  hypermodern: "/images/good.png",
  system: "/images/teoretical.png",
  flank: "/images/inaccuracy.png",
  trap: "/images/blunder.png",
};

const CATEGORY_MAP: Record<string, CategoryKey> = {
  "Classical openings": "classical",
  "Gambits": "gambit",
  "Countergambits": "countergambit",
  "Hypermodern openings": "hypermodern",
  "System openings": "system",
  "Flank openings": "flank",
  "Trap openings": "trap",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  "Basic": "Базовый",
  "System-based": "Системный",
  "Tactical": "Тактический",
  "Theoretical": "Теоретический",
  "Conceptual": "Концептуальный",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  "Basic": "text-emerald",
  "System-based": "text-sky",
  "Tactical": "text-amber",
  "Theoretical": "text-destructive",
  "Conceptual": "text-muted-foreground",
};

const RATING_SET = new Set(["0–700", "700–1000", "1000–1300", "1300–1600", "1600–2000", "2000+"]);

function fileStem(fileName: string): string {
  return fileName.replace(/\.bin$/i, "");
}

function normalizeCategory(raw: string): string {
  return raw.replace(/_/g, " ").trim();
}

function normalizeRating(raw: string): string {
  return raw.replace(/-/g, "–").replace(/\s+/g, "");
}

function parseClassificationLine(line: string): {
  bookFile: string;
  nameRu: string;
  ratingRange: string;
  categoryRaw: string;
  difficultyRaw: string;
} | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const match = trimmed.match(/^(\S+)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+?)\s{2,}(.+)$/);
  if (!match) {
    return null;
  }

  return {
    bookFile: match[1].trim(),
    nameRu: match[2].trim(),
    ratingRange: normalizeRating(match[3].trim()),
    categoryRaw: normalizeCategory(match[4]),
    difficultyRaw: match[5].trim(),
  };
}

function buildLibraryOpenings(booksIndexInput: Record<string, string>, preset: LibraryTab): LibraryOpening[] {
  const openings = openingsJson as Opening[];

  const openingById = new Map(openings.map((opening) => [opening.id, opening]));
  const openingIdByBookFile = new Map<string, string>();

  for (const [openingId, path] of Object.entries(booksIndexInput)) {
    const bookFile = path.split("/").pop() ?? path;
    openingIdByBookFile.set(bookFile, openingId);
  }

  const result: LibraryOpening[] = [];

  for (const rawLine of classificationRaw.split(/\r?\n/)) {
    const parsed = parseClassificationLine(rawLine);
    if (!parsed) {
      continue;
    }

    const category = CATEGORY_MAP[parsed.categoryRaw];
    const ratingRange = parsed.ratingRange;
    const difficulty = parsed.difficultyRaw;
    if (!category || !RATING_SET.has(ratingRange) || !DIFFICULTY_LABELS[difficulty]) {
      continue;
    }

    const openingId = openingIdByBookFile.get(parsed.bookFile);
    if (!openingId) {
      continue;
    }
    const opening = openingById.get(openingId);

    result.push({
      id: opening?.id ?? fileStem(parsed.bookFile).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      bookFile: parsed.bookFile,
      preset,
      nameRu: parsed.nameRu,
      nameEn: opening?.name ?? fileStem(parsed.bookFile).replace(/_/g, " "),
      category,
      ratingRange,
      difficultyKey: difficulty,
      movesPreview: (opening?.moves ?? []).slice(0, 6).join(" ") || undefined,
    });
  }

  return result;
}

const GENERAL_OPENINGS = buildLibraryOpenings(booksIndexJson as Record<string, string>, "general");
const SECOND_OPENINGS = buildLibraryOpenings(booksSecondIndexJson as Record<string, string>, "second");

export function PopupLibrary() {
  const [tab, setTab] = useState<LibraryTab>("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null);
  const [selectedOpening, setSelectedOpening] = useState<LibraryOpening | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }
    runtime.sendMessage({ type: "favorites:list" }, (response) => {
      if (!response?.ok || !Array.isArray(response.payload)) {
        return;
      }
      setFavoriteIds(new Set(response.payload as string[]));
    });

    const onMessage = (message: unknown) => {
      const payload = message as { type?: string; payload?: string[] };
      if (payload.type === "favorites:state" && Array.isArray(payload.payload)) {
        setFavoriteIds(new Set(payload.payload));
      }
    };

    runtime.onMessage.addListener(onMessage);
    return () => {
      runtime.onMessage.removeListener(onMessage);
    };
  }, []);

  const hasSecondPreset = SECOND_OPENINGS.length > 0;
  const openingsData = tab === "second" && hasSecondPreset ? SECOND_OPENINGS : GENERAL_OPENINGS;

  const filtered = useMemo(() => {
    let result = openingsData;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (opening) =>
          opening.nameRu.toLowerCase().includes(q) ||
          opening.nameEn.toLowerCase().includes(q) ||
          opening.bookFile.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      result = result.filter((opening) => opening.category === selectedCategory);
    }
    return [...result].sort((a, b) => a.nameRu.localeCompare(b.nameRu, "ru"));
  }, [openingsData, searchQuery, selectedCategory, tab]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      classical: 0,
      gambit: 0,
      countergambit: 0,
      hypermodern: 0,
      system: 0,
      flank: 0,
      trap: 0,
    };

    for (const opening of openingsData) {
      counts[opening.category] += 1;
    }
    return counts;
  }, [openingsData]);

  const toggleFavorite = (id: string): void => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      const remove = next.has(id);
      if (remove) {
        next.delete(id);
      } else {
        next.add(id);
      }

      const runtime = globalThis.chrome?.runtime;
      if (runtime?.sendMessage) {
        runtime.sendMessage({
          type: remove ? "favorites:remove" : "favorites:add",
          payload: { id },
        });
      }
      return next;
    });
  };

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

          <div className="rounded-xl bg-card border border-border/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className={cn("text-sm font-semibold", DIFFICULTY_COLORS[selectedOpening.difficultyKey])}>
                {DIFFICULTY_LABELS[selectedOpening.difficultyKey]}
              </span>
              <span className="text-sm font-mono text-muted-foreground">{selectedOpening.ratingRange}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground leading-tight">{selectedOpening.nameRu}</h2>
            <p className="text-xs text-muted-foreground mt-1">{selectedOpening.nameEn}</p>
            {selectedOpening.movesPreview && (
              <p className="text-sm font-mono text-foreground/80 mt-3">{selectedOpening.movesPreview}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Поиск дебютов..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
          />
        </div>

        <div
          className={cn(
            "grid rounded-xl p-1 bg-card border border-border/60",
            hasSecondPreset ? "grid-cols-2" : "grid-cols-1"
          )}
        >
          <button
            type="button"
            onClick={() => {
              setTab("general");
              setSelectedCategory(null);
              setSelectedOpening(null);
            }}
            className={cn(
              "py-2 text-xs font-semibold rounded-lg transition-all",
              tab === "general" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Общие
          </button>
          {hasSecondPreset && (
            <button
              type="button"
              onClick={() => {
                setTab("second");
                setSelectedCategory(null);
                setSelectedOpening(null);
              }}
              className={cn(
                "py-2 text-xs font-semibold rounded-lg transition-all",
                tab === "second" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Вторые
            </button>
          )}
        </div>
      </div>

      {!selectedCategory && !searchQuery ? (
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2">
            {tab === "second" ? "Вторые дебюты" : "Категории дебютов"}
          </h3>
          <div className="flex flex-col gap-2">
            {CATEGORY_ORDER.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:bg-card/80 transition-all group text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                  <img
                    src={CATEGORY_ICON_BY_KEY[category]}
                    alt={CATEGORY_LABELS[category]}
                    width={22}
                    height={22}
                    className="object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {CATEGORY_LABELS[category]}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">{categoryCounts[category]}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{CATEGORY_DESCRIPTIONS[category]}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/60 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          {selectedCategory && (
            <div className="pb-2">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="text-xs">Все категории</span>
              </button>
              <h3 className="text-sm font-semibold text-foreground">{CATEGORY_LABELS[selectedCategory]}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">{CATEGORY_DESCRIPTIONS[selectedCategory]}</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {filtered.map((opening) => (
              <div
                key={opening.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedOpening(opening)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedOpening(opening);
                  }
                }}
                className="p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 transition-all group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn("text-[11px] font-semibold", DIFFICULTY_COLORS[opening.difficultyKey])}>
                        {DIFFICULTY_LABELS[opening.difficultyKey]}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">{opening.ratingRange}</span>
                    </div>

                    <p className="text-sm font-semibold text-foreground truncate">{opening.nameRu}</p>
                    {opening.movesPreview && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{opening.movesPreview}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleFavorite(opening.id);
                    }}
                    aria-label="Toggle favorite"
                    className="p-1 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Star
                      className={cn(
                        "w-4 h-4",
                        favoriteIds.has(opening.id) ? "text-primary fill-primary" : "text-muted-foreground/40"
                      )}
                    />
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <p className="text-xs text-muted-foreground">Ничего не найдено.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
