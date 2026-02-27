"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { type RatingRange, ratingLabels } from "@/lib/chess-data";
import { ChevronRight, Info } from "lucide-react";
import type { PerformanceMode } from "@/shared/types";
import { usePopupLanguage } from "./popup-language";

const RATING_LABELS_EN: Record<RatingRange, string> = {
  "0-700": "Beginner",
  "700-1000": "Novice",
  "1000-1300": "Intermediate",
  "1300-1600": "Advanced",
  "1600-2000": "Strong",
  "2000+": "Master",
};

export function PopupSettings() {
  const { language, setLanguage } = usePopupLanguage();
  const isRu = language === "ru";
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
          {isRu ? "Настройки" : "Settings"}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        <div className="rounded-xl bg-card border border-border/50">
          <div className="px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-medium text-foreground">{isRu ? "Язык интерфейса" : "Interface language"}</span>
          </div>
          <div className="p-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all",
                language === "en"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
              )}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage("ru")}
              className={cn(
                "px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all",
                language === "ru"
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary"
              )}
            >
              Русский
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/50">
          <div className="px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-medium text-foreground">{isRu ? "Ваш рейтинг" : "Your rating"}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isRu ? "Определяет глубину и набор дебютов" : "Defines opening depth and available pool"}
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
              {isRu ? ratingLabels[selectedRating] : RATING_LABELS_EN[selectedRating]}
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/50">
          <div className="px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-medium text-foreground">{isRu ? "Ограничения по ELO" : "ELO limits"}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isRu
                ? "Фильтр дебютов и лимит глубины по вашему диапазону рейтинга"
                : "Opening filter and depth cap by your rating range"}
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
              aria-label={isRu ? "Отключить ограничения" : "Disable limits"}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-background absolute top-0.5 transition-all duration-200 shadow-sm",
                  limitsDisabled ? "left-[20px]" : "left-0.5"
                )}
              />
            </button>
            <p className="text-[10px] mt-2 text-muted-foreground">
              {isRu ? "Отключить ограничения" : "Disable limits"}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/50">
          <div className="px-3 py-2.5 border-b border-border/50">
            <span className="text-xs font-medium text-foreground">{isRu ? "Производительность" : "Performance"}</span>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {isRu ? "Стандартный режим показывает все ходы, Экономия снижает нагрузку" : "Standard shows all moves, Economy reduces load"}
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
              {isRu ? "Стандартный" : "Standard"}
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
              {isRu ? "Экономия" : "Economy"}
            </button>
          </div>
          <div className="px-3 py-2 border-t border-border/30">
            <span className="text-[10px] text-primary font-medium">
              {performanceMode === "standard"
                ? isRu
                  ? "Стандарт: полная частота обновления и все теоретические ходы"
                  : "Standard: full update rate and all theoretical moves"
                : isRu
                  ? "Экономия: реже обновляет позицию и показывает до 3 ходов"
                  : "Economy: updates less often and shows up to 3 moves"}
            </span>
          </div>
        </div>

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
            <p className="text-sm font-semibold text-destructive mb-1">{isRu ? "Предупреждение" : "Warning"}</p>
            <p className="text-xs text-destructive/90 leading-relaxed">
              {isRu
                ? "Отключение ограничений может привести к подозрительно точной игре и потенциальному бану при неаккуратном использовании."
                : "Disabling limits can lead to suspiciously accurate play and potential bans if used carelessly."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={confirmDisableLimits}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-destructive/60 text-destructive bg-destructive/15"
              >
                {isRu ? "Понимаю, включить" : "I understand, enable"}
              </button>
              <button
                type="button"
                onClick={() => setShowLimitsWarning(false)}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-border/60 text-muted-foreground bg-secondary/40"
              >
                {isRu ? "Отмена" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAboutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/70 backdrop-blur-[2px] px-4">
          <div className="w-full max-h-[78vh] overflow-y-auto rounded-xl border border-border/70 bg-card p-4 shadow-2xl">
            <p className="text-sm font-semibold text-foreground mb-1">Line Master</p>
            <p className="text-[11px] text-muted-foreground mb-3">{isRu ? "Версия 1.0.0" : "Version 1.0.0"}</p>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div>
                <p className="text-foreground font-medium mb-1">{isRu ? "Что это за программа" : "What this app is"}</p>
                <p>
                  {isRu
                    ? "Line Master — расширение для показа теоретических дебютных ходов из локальных Polyglot-книг по текущей позиции на доске."
                    : "Line Master is an extension that shows theoretical opening moves from local Polyglot books for the current board position."}
                </p>
              </div>

              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-destructive font-medium mb-1">{isRu ? "Отказ от ответственности" : "Disclaimer"}</p>
                <p className="text-destructive/90">
                  {isRu
                    ? "Вы используете расширение на свой риск. Автор не несёт ответственность за ограничения, блокировку или бан вашего аккаунта."
                    : "You use this extension at your own risk. The author is not responsible for restrictions, suspensions, or bans on your account."}
                </p>
                <p className="text-destructive/90 mt-2">
                  {isRu
                    ? "Неаккуратное и чрезмерное использование подсказок может повышать риск санкций со стороны платформ."
                    : "Careless or excessive hint usage may increase the risk of platform sanctions."}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
              >
                {isRu ? "Закрыть" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
