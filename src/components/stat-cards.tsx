"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Star, TrendingUp, Target } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/20",
        accent && "amber-glow border-primary/10"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </span>
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg",
            accent ? "bg-primary/10" : "bg-secondary"
          )}
        >
          <Icon
            className={cn(
              "w-4 h-4",
              accent ? "text-primary" : "text-muted-foreground"
            )}
          />
        </div>
      </div>
      <div>
        <p
          className={cn(
            "text-2xl font-semibold tracking-tight",
            accent ? "text-primary" : "text-foreground"
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export function StatCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Дебютов"
        value="12"
        sub="в базе данных"
        icon={BookOpen}
        accent
      />
      <StatCard
        label="Избранных"
        value="4"
        sub="дебюта сохранено"
        icon={Star}
      />
      <StatCard
        label="Категорий"
        value="7"
        sub="типов дебютов"
        icon={Target}
      />
      <StatCard
        label="Рейтинг"
        value="1300"
        sub="текущий уровень"
        icon={TrendingUp}
      />
    </div>
  );
}
