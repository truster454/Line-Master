"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { UILanguage } from "@/shared/types";

interface PopupLanguageContextValue {
  language: UILanguage;
  setLanguage: (next: UILanguage) => void;
}

const PopupLanguageContext = createContext<PopupLanguageContextValue>({
  language: "en",
  setLanguage: () => {},
});

export function PopupLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<UILanguage>("en");

  useEffect(() => {
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }

    runtime.sendMessage({ type: "settings:get" }, (response) => {
      if (globalThis.chrome?.runtime?.lastError) {
        return;
      }
      const next = response?.payload?.uiLanguage;
      if (next === "ru" || next === "en") {
        setLanguageState(next);
      }
    });

    const onMessage = (message: unknown) => {
      const payload = message as { type?: string; payload?: { uiLanguage?: UILanguage } };
      if (payload.type !== "settings:state") {
        return;
      }
      const next = payload.payload?.uiLanguage;
      if (next === "ru" || next === "en") {
        setLanguageState(next);
      }
    };

    runtime.onMessage.addListener(onMessage);
    return () => runtime.onMessage.removeListener(onMessage);
  }, []);

  const setLanguage = (next: UILanguage) => {
    setLanguageState(next);
    const runtime = globalThis.chrome?.runtime;
    if (!runtime?.sendMessage) {
      return;
    }
    try {
      runtime.sendMessage({ type: "language:set", payload: { uiLanguage: next } });
    } catch {
      // popup closed or extension reloaded
    }
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <PopupLanguageContext.Provider value={value}>{children}</PopupLanguageContext.Provider>;
}

export function usePopupLanguage(): PopupLanguageContextValue {
  return useContext(PopupLanguageContext);
}
