"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { type RatingRange, ratingLabels } from "@/lib/chess-data";
import { ChevronRight, Info } from "lucide-react";
import type { PerformanceMode } from "@/shared/types";

export function PopupSettings() {
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>("standard");
  const [selectedRating, setSelectedRating] = useState<RatingRange>("1000-1300");
  const [limitsDisabled, setLimitsDisabled] = useState(false);
  const [showLimitsWarning, setShowLimitsWarning] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }

    runtime.sendMessage({ type: "settings:get" }, (response) => {
      if (globalThis.chrome?.runtime?.lastError) {
        return;
      }
      if (!response?.ok || !response.payload) {
        return;
      }
      const payload = response.payload as {
        performanceMode?: PerformanceMode;
        ratingRange?: RatingRange;
        limitsDisabled?: boolean;
      };
      if (payload.performanceMode === "standard" || payload.performanceMode === "economy") {
        setPerformanceMode(payload.performanceMode);
      }
      if (payload.ratingRange) {
        setSelectedRating(payload.ratingRange);
      }
      setLimitsDisabled(Boolean(payload.limitsDisabled));
    });

    const onMessage = (message: unknown) => {
      const payload = message as {
        type?: string;
        payload?: { performanceMode?: PerformanceMode; ratingRange?: RatingRange; limitsDisabled?: boolean };
      };
      if (payload.type !== "settings:state" || !payload.payload) {
        return;
      }
      const settings = payload.payload;
      if (settings.performanceMode === "standard" || settings.performanceMode === "economy") {
        setPerformanceMode(settings.performanceMode);
      }
      if (settings.ratingRange) {
        setSelectedRating(settings.ratingRange);
      }
      setLimitsDisabled(Boolean(settings.limitsDisabled));
    };

    runtime.onMessage.addListener(onMessage);
    return () => runtime.onMessage.removeListener(onMessage);
  }, []);

  const changePerformanceMode = (next: PerformanceMode) => {
    if (next === performanceMode) {
      return;
    }
    setPerformanceMode(next);
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }
    try {
      runtime.sendMessage({ type: "performance:set", payload: { mode: next } });
    } catch {
      // popup closed or extension reloaded
    }
  };

  const changeRatingRange = (next: RatingRange) => {
    setSelectedRating(next);
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }
    try {
      runtime.sendMessage({ type: "rating:set", payload: { ratingRange: next } });
    } catch {
      // popup closed or extension reloaded
    }
  };

  const requestToggleLimits = (nextDisabled: boolean) => {
    if (nextDisabled) {
      setShowLimitsWarning(true);
      return;
    }

    setLimitsDisabled(false);
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }
    try {
      runtime.sendMessage({ type: "limits:set", payload: { disabled: false } });
    } catch {
      // popup closed or extension reloaded
    }
  };

  const confirmDisableLimits = () => {
    setShowLimitsWarning(false);
    setLimitsDisabled(true);
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }
    try {
      runtime.sendMessage({ type: "limits:set", payload: { disabled: true } });
    } catch {
      // popup closed or extension reloaded
    }
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-3 pb-2">
        <h3 className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Настройки
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {/* Rating selector */}
        <div className="rounded-xl bg-card border border-border/50">
          <div className="px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-medium text-foreground">Ваш рейтинг</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Определяет глубину и набор дебютов
            </p>
          </div>
          <div className="p-2 grid grid-cols-3 gap-1.5">
            {(Object.keys(ratingLabels) as RatingRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => changeRatingRange(range)}
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[10px] font-medium border transition-all",
                  selectedRating === range
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="px-3 py-2 border-t border-border/30">
            <span className="text-[10px] text-primary font-medium">
              {ratingLabels[selectedRating]}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/50">
          <div className="px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-medium text-foreground">Ограничения по ELO</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Фильтр дебютов и лимит глубины по вашему диапазону рейтинга
            </p>
          </div>
          <div className="px-3 py-3">
            <button
              type="button"
              onClick={() => requestToggleLimits(!limitsDisabled)}
              className={cn(
                "w-10 h-5 rounded-full transition-all duration-200 relative",
                limitsDisabled ? "bg-destructive" : "bg-secondary"
              )}
              aria-label="Отключить ограничения"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-background absolute top-0.5 transition-all duration-200 shadow-sm",
                  limitsDisabled ? "left-[20px]" : "left-0.5"
                )}
              />
            </button>
            <p className="text-[10px] mt-2 text-muted-foreground">
              Отключить ограничения
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/50">
          <div className="px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-medium text-foreground">Производительность</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Стандартный режим показывает все ходы, Экономия снижает нагрузку
            </p>
          </div>
          <div className="p-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => changePerformanceMode("standard")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all",
                performanceMode === "standard"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
              )}
            >
              Стандартный
            </button>
            <button
              type="button"
              onClick={() => changePerformanceMode("economy")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all",
                performanceMode === "economy"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
              )}
            >
              Экономия
            </button>
          </div>
          <div className="px-3 py-2 border-t border-border/30">
            <span className="text-[10px] text-primary font-medium">
              {performanceMode === "standard"
                ? "Стандарт: полная частота обновления и все теоретические ходы"
                : "Экономия: реже обновляет позицию и показывает до 3 ходов"}
            </span>
          </div>
        </div>

        {/* About */}
        <button
          type="button"
          onClick={() => setShowAboutModal(true)}
          className="rounded-xl bg-card border border-border/50 text-left hover:border-primary/30 transition-colors"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-medium text-foreground">Line Master</span>
              <p className="text-[10px] text-muted-foreground">v1.0.0</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
          </div>
        </button>
      </div>

      {showLimitsWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-[2px] px-4">
          <div className="w-full rounded-xl border border-destructive/70 bg-card p-4 shadow-2xl">
            <p className="text-sm font-semibold text-destructive mb-1">Предупреждение</p>
            <p className="text-xs text-destructive/90 leading-relaxed">
              Отключение ограничений может привести к подозрительно точной игре и потенциальному бану при
              неаккуратном использовании.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={confirmDisableLimits}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-destructive/60 text-destructive bg-destructive/15"
              >
                Понимаю, включить
              </button>
              <button
                type="button"
                onClick={() => setShowLimitsWarning(false)}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-border/60 text-muted-foreground bg-secondary/40"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {showAboutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-[2px] px-4">
          <div className="w-full max-h-[78vh] overflow-y-auto rounded-xl border border-border/70 bg-card p-4 shadow-2xl">
            <p className="text-sm font-semibold text-foreground mb-1">Line Master</p>
            <p className="text-[11px] text-muted-foreground mb-3">Версия 1.0.0</p>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div>
                <p className="text-foreground font-medium mb-1">Что это за программа</p>
                <p>
                  Line Master — расширение для показа теоретических дебютных ходов из локальных Polyglot-книг по
                  текущей позиции на доске.
                </p>
              </div>

              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-destructive font-medium mb-1">Отказ от ответственности</p>
                <p className="text-destructive/90">
                  Вы используете расширение на свой риск. Автор не несёт ответственность за ограничения, блокировку
                  или бан вашего аккаунта.
                </p>
                <p className="text-destructive/90 mt-2">
                  Неаккуратное и чрезмерное использование подсказок может повышать риск санкций со стороны платформ.
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
