"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Settings, User, Palette } from "lucide-react";

export function SettingsView() {
  const [currentRating, setCurrentRating] = useState("1300");
  const [showNotations, setShowNotations] = useState(true);
  const [autoTheory, setAutoTheory] = useState(true);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground tracking-tight">
          Настройки
        </h1>
        <p className="text-xs text-muted-foreground">
          Персонализация и конфигурация расширения
        </p>
      </div>

      {/* Profile section */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <User className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Профиль</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="rating" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Ваш рейтинг
            </label>
            <input
              id="rating"
              type="number"
              value={currentRating}
              onChange={(e) => setCurrentRating(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-secondary/30 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
              min="0"
              max="3000"
            />
            <p className="text-[10px] text-muted-foreground">
              Рейтинг используется для фильтрации дебютов по уровню
            </p>
          </div>
        </div>
      </div>

      {/* Display section */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Palette className="w-4 h-4 text-sky" />
          <h2 className="text-sm font-semibold text-foreground">Отображение</h2>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground">Шахматная нотация</span>
              <span className="text-[10px] text-muted-foreground">
                Показывать фигурные обозначения вместо текстовых
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowNotations(!showNotations)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors duration-200",
                showNotations ? "bg-primary" : "bg-secondary"
              )}
              role="switch"
              aria-checked={showNotations}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform duration-200",
                  showNotations ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground">
                Авто-подсказки теории
              </span>
              <span className="text-[10px] text-muted-foreground">
                Показывать теорию дебюта во время игры
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAutoTheory(!autoTheory)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors duration-200",
                autoTheory ? "bg-primary" : "bg-secondary"
              )}
              role="switch"
              aria-checked={autoTheory}
            >
              <span
                className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform duration-200",
                  autoTheory ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <Settings className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">О расширении</h2>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Версия</span>
            <span className="text-xs font-mono text-foreground">0.1.0-alpha</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Дебютов в базе</span>
            <span className="text-xs font-mono text-foreground">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Последнее обновление</span>
            <span className="text-xs font-mono text-foreground">09.02.2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
