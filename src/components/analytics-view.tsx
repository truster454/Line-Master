"use client";

import { cn } from "@/lib/utils";
import {
  openings,
  categoryLabels,
  type OpeningCategory,
} from "@/lib/chess-data";
import { BarChart3, TrendingUp, PieChart } from "lucide-react";

export function AnalyticsView() {
  // Category distribution
  const categoryCount: Record<string, number> = {};
  for (const o of openings) {
    categoryCount[o.category] = (categoryCount[o.category] || 0) + 1;
  }

  // Rating distribution
  const ratingCount: Record<string, number> = {};
  for (const o of openings) {
    ratingCount[o.ratingRange] = (ratingCount[o.ratingRange] || 0) + 1;
  }

  // Most popular
  const topByPopularity = [...openings]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 5);

  // Deepest theory
  const topByDepth = [...openings]
    .sort((a, b) => b.theoryDepth - a.theoryDepth)
    .slice(0, 5);

  const maxCatCount = Math.max(...Object.values(categoryCount));
  const maxRatingCount = Math.max(...Object.values(ratingCount));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          Аналитика
        </h1>
        <p className="text-xs text-muted-foreground">
          Статистика и распределение дебютов в базе
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category distribution */}
        <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">
              По категориям
            </h2>
          </div>
          <div className="flex flex-col gap-2.5">
            {Object.entries(categoryCount)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground min-w-[100px]">
                    {categoryLabels[cat as OpeningCategory]}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all duration-500"
                      style={{
                        width: `${(count / maxCatCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-foreground min-w-[24px] text-right">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Rating distribution */}
        <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky" />
            <h2 className="text-sm font-semibold text-foreground">
              По рейтингу
            </h2>
          </div>
          <div className="flex items-end gap-3 h-40 pt-4">
            {[
              "0-700",
              "700-1000",
              "1000-1300",
              "1300-1600",
              "1600-2000",
              "2000+",
            ].map((range) => {
              const count = ratingCount[range] || 0;
              const height = maxRatingCount > 0 ? (count / maxRatingCount) * 100 : 0;
              return (
                <div key={range} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-mono text-foreground">
                    {count}
                  </span>
                  <div className="w-full rounded-t-md bg-secondary overflow-hidden relative" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-md bg-gradient-to-t from-primary/60 to-primary/30 transition-all duration-500"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                    {range}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top by popularity */}
        <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald" />
            <h2 className="text-sm font-semibold text-foreground">
              Самые популярные
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {topByPopularity.map((o, i) => (
              <div
                key={o.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/50"
              >
                <span className="text-xs font-mono text-primary font-bold w-5">
                  {`#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {o.nameRu}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {o.eco}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald"
                      style={{ width: `${o.popularity}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground min-w-[28px] text-right">
                    {o.popularity}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top by theory depth */}
        <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber" />
            <h2 className="text-sm font-semibold text-foreground">
              Самая глубокая теория
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {topByDepth.map((o, i) => (
              <div
                key={o.id}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/50"
              >
                <span className="text-xs font-mono text-primary font-bold w-5">
                  {`#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">
                    {o.nameRu}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {o.eco}
                  </p>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <div
                      key={`analytics-depth-${o.id}-${j}`}
                      className={cn(
                        "w-1.5 h-4 rounded-full",
                        j < o.theoryDepth ? "bg-primary/50" : "bg-secondary"
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
