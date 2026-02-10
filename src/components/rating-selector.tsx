"use client";

import { cn } from "@/lib/utils";
import { type RatingRange, ratingLabels } from "@/lib/chess-data";

interface RatingSelectorProps {
  activeRating: RatingRange | null;
  onSelectRating: (rating: RatingRange | null) => void;
}

const ratingRanges: RatingRange[] = [
  "0-700",
  "700-1000",
  "1000-1300",
  "1300-1600",
  "1600-2000",
  "2000+",
];

const ratingBarWidths: Record<RatingRange, string> = {
  "0-700": "w-[12%]",
  "700-1000": "w-[25%]",
  "1000-1300": "w-[45%]",
  "1300-1600": "w-[65%]",
  "1600-2000": "w-[85%]",
  "2000+": "w-full",
};

export function RatingSelector({
  activeRating,
  onSelectRating,
}: RatingSelectorProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Теория по рейтингу
        </h2>
        {activeRating && (
          <button
            type="button"
            onClick={() => onSelectRating(null)}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Все рейтинги
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {ratingRanges.map((range) => {
          const isActive = activeRating === range;
          return (
            <button
              key={range}
              type="button"
              onClick={() =>
                onSelectRating(isActive ? null : range)
              }
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border border-border bg-card transition-all duration-150 group hover:border-primary/20",
                isActive && "border-primary/30 bg-primary/5"
              )}
            >
              <span
                className={cn(
                  "text-xs font-mono font-semibold min-w-[56px] text-left",
                  isActive ? "text-primary" : "text-foreground"
                )}
              >
                {range}
              </span>
              <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    ratingBarWidths[range],
                    isActive ? "bg-primary" : "bg-primary/30 group-hover:bg-primary/50"
                  )}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] min-w-[80px] text-right",
                  isActive
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {ratingLabels[range]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
