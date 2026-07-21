"use client";
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

// ── Supported languages ──────────────────────────────────────────────────────
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English",    nativeLabel: "English" },
  { code: "hi", label: "Hindi",      nativeLabel: "हिन्दी" },
  { code: "bn", label: "Bengali",    nativeLabel: "বাংলা" },
  { code: "ta", label: "Tamil",      nativeLabel: "தமிழ்" },
  { code: "te", label: "Telugu",     nativeLabel: "తెలుగు" },
  { code: "mr", label: "Marathi",    nativeLabel: "मराठी" },
  { code: "gu", label: "Gujarati",   nativeLabel: "ગુજરાતી" },
  { code: "kn", label: "Kannada",    nativeLabel: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam",  nativeLabel: "മലയാളം" },
  { code: "pa", label: "Punjabi",    nativeLabel: "ਪੰਜਾਬੀ" },
];

const REGION_LANGUAGE_MAP: Record<string, string> = {
  "west bengal": "bn", "kolkata": "bn", "bengal": "bn",
  "maharashtra": "mr", "mumbai": "mr", "pune": "mr",
  "gujarat": "gu", "ahmedabad": "gu", "surat": "gu",
  "tamil nadu": "ta", "chennai": "ta", "coimbatore": "ta",
  "telangana": "te", "andhra pradesh": "te", "hyderabad": "te",
  "karnataka": "kn", "bangalore": "kn", "bengaluru": "kn",
  "kerala": "ml", "thiruvananthapuram": "ml", "kochi": "ml",
  "punjab": "pa", "chandigarh": "pa",
  "delhi": "hi", "new delhi": "hi", "uttar pradesh": "hi",
  "rajasthan": "hi", "madhya pradesh": "hi", "bihar": "hi",
  "jharkhand": "hi", "haryana": "hi", "uttarakhand": "hi",
  "himachal pradesh": "hi",
};

function detectLanguageFromRegion(address: Record<string, string>): string {
  const candidates = [
    address.city, address.town, address.county,
    address.state, address.state_district, address.suburb,
  ].filter(Boolean).map((s) => s!.toLowerCase());

  for (const candidate of candidates) {
    for (const [key, lang] of Object.entries(REGION_LANGUAGE_MAP)) {
      if (candidate.includes(key) || key.includes(candidate)) return lang;
    }
  }
  return "en";
}

// ── Context types ────────────────────────────────────────────────────────────
interface LanguageContextValue {
  language: string;
  setLanguage: (code: string) => void;
  t: (key: string, fallback: string) => string;
  translate: (strings: Record<string, string>, namespace?: string) => Promise<Record<string, string>>;
  isLoading: boolean;
  detectedLanguage: string | null;
  isManualOverride: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (_, fallback) => fallback,
  translate: async (s) => s,
  isLoading: false,
  detectedLanguage: null,
  isManualOverride: false,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
// Cache key format: lang_cache_{lang}_{namespace}
// We scope cache by language so switching languages always hits fresh storage.
const CACHE_PREFIX = "lang_cache_";
const MANUAL_LANG_KEY = "user_language_override";

function getCacheKey(lang: string, namespace: string) {
  return `${CACHE_PREFIX}${lang}_${namespace}`;
}

function getCached(lang: string, namespace: string): Record<string, string> | null {
  try {
    const raw = sessionStorage.getItem(getCacheKey(lang, namespace));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCache(lang: string, namespace: string, data: Record<string, string>) {
  try {
    sessionStorage.setItem(getCacheKey(lang, namespace), JSON.stringify(data));
  } catch {
    console.warn("Failed to cache translations in sessionStorage");
  }
}

// THE FIX: clear ALL cached entries for a specific language so a language
// switch never returns stale translations.
function clearCacheForLanguage(lang: string) {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(`${CACHE_PREFIX}${lang}_`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    console.warn("Failed to clear translation cache");
  }
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState("en");
  const [isLoading, setIsLoading] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isManualOverride, setIsManualOverride] = useState(false);

  // Tracks the language at the time each translation was stored so translate()
  // can detect a mid-flight language change and discard the stale result.
  const languageRef = useRef("en");
  const translationsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem(MANUAL_LANG_KEY);
    if (saved) {
      setLanguageState(saved);
      languageRef.current = saved;
      setIsManualOverride(true);
      setIsLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const detected = detectLanguageFromRegion(data.address ?? {});
          setDetectedLanguage(detected);
          setLanguageState(detected);
          languageRef.current = detected;
        } catch (e) {
          console.error("Geo detection failed:", e);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.warn("Geolocation denied or failed:", err.message);
        setIsLoading(false);
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((code: string) => {
    // 1. Clear the in-memory translation store.
    translationsRef.current = {};
    // 2. Clear sessionStorage cache for the NEW language so we always fetch
    //    fresh strings for it (the old language's cache stays valid if the
    //    user ever switches back).
    clearCacheForLanguage(code);
    // 3. Update state + ref together so languageRef is never stale.
    languageRef.current = code;
    setLanguageState(code);
    setIsManualOverride(true);
    localStorage.setItem(MANUAL_LANG_KEY, code);
  }, []);

  const translate = useCallback(
    async (
      strings: Record<string, string>,
      namespace = "default"
    ): Promise<Record<string, string>> => {
      // Capture language at call-time to detect mid-flight switches.
      const calledWithLang = languageRef.current;

      if (calledWithLang === "en") return strings;

      const cached = getCached(calledWithLang, namespace);
      if (cached) return cached;

      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ strings, targetLanguage: calledWithLang }),
        });
        const data = await res.json();
        const result: Record<string, string> = data.translations ?? strings;

        // Only store if the language hasn't changed while we were awaiting.
        if (languageRef.current === calledWithLang) {
          setCache(calledWithLang, namespace, result);
          translationsRef.current = { ...translationsRef.current, ...result };
        }

        return result;
      } catch {
        return strings;
      }
    },
    // translate() reads language via languageRef (always current) instead of
    // closing over the `language` state value, so we don't need language in
    // the dep array. This prevents a new translate reference on every render
    // which would cause infinite loops in consumer useEffects.
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const t = useCallback((key: string, fallback: string): string => {
    return translationsRef.current[key] ?? fallback;
  }, []);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      translate,
      isLoading,
      detectedLanguage,
      isManualOverride,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}