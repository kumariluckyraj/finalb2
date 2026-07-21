"use client";

import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";

export function useTranslation(
  namespace: string,
  strings: Record<string, string>,
) {
  const { language, translate } = useLanguage();

  const [translated, setTranslated] = useState<Record<string, string>>(strings);
  const [isTranslating, setIsTranslating] = useState(false);

  // Keep a ref to the latest translate function so the effect never captures
  // a stale closure — important because translate() is now stable ([] deps)
  // but we still want the freshest reference just in case.
  const translateRef = useRef(translate);
  useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  // Also keep a ref to the current language so we can detect if it changed
  // while an async translate() call was in-flight.
  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    let mounted = true;
    const calledForLang = language; // capture at call time

    async function loadTranslations() {
      if (calledForLang === "en") {
        if (mounted) setTranslated(strings);
        return;
      }

      try {
        if (mounted) setIsTranslating(true);
        const result = await translateRef.current(strings, namespace);

        // Discard result if language changed while we were awaiting
        if (!mounted || languageRef.current !== calledForLang) return;

        setTranslated(result);
      } catch (error) {
        console.error(
          `[useTranslation:${namespace}] Translation failed:`,
          error,
        );
        if (mounted) setTranslated(strings);
      } finally {
        if (mounted) setIsTranslating(false);
      }
    }

    loadTranslations();
    return () => {
      mounted = false;
    };

    // Re-run whenever language changes. `strings` and `namespace` are stable
    // (defined outside components as constants) so they don't need to be deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, namespace]);

  function t(key: string): string {
    return translated[key] ?? strings[key] ?? key;
  }

  return { t, isTranslating, translated, namespace };
}
