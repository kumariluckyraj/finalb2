"use client";
import { useState, useRef, useEffect } from "react";
import { useLanguage, SUPPORTED_LANGUAGES } from "@/context/LanguageContext";

interface LanguagePickerProps {
  /** Pass "dark" when the component sits on the blue navbar */
  variant?: "light" | "dark";
}

export default function LanguagePicker({ variant = "dark" }: LanguagePickerProps) {
  const { language, setLanguage, detectedLanguage, isManualOverride } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language) ?? SUPPORTED_LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const textColor = variant === "dark" ? "#fff" : "#000000";
  const borderColor = variant === "dark" ? "rgba(255,255,255,0.35)" : "#e2e8f0";
  const hoverBg = variant === "dark" ? "rgba(255,255,255,0.12)" : "#f1f5f9";

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change language"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: `1px solid ${borderColor}`,
          borderRadius: "6px",
          padding: "5px 10px",
          cursor: "pointer",
          color: textColor,
          fontSize: "12.5px",
          fontWeight: 600,
          letterSpacing: "0.2px",
          whiteSpace: "nowrap",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = hoverBg; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
      >
        {/* Globe icon */}
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
        </svg>
        {current.nativeLabel}
        {/* Auto-detected indicator */}
        {!isManualOverride && detectedLanguage && detectedLanguage !== "en" && (
          <span style={{
            background: "#1a211e", color: "#111",
            fontSize: "9px", fontWeight: 800,
            padding: "1px 5px", borderRadius: "2px", letterSpacing: "0.4px",
          }}>
            AUTO
          </span>
        )}
        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          background: "#fff",
          borderRadius: "4px",
          boxShadow: "none",
          minWidth: "180px",
          zIndex: 600,
          overflow: "hidden",
          animation: "langFadeDown 0.15s ease",
        }}>
          <style>{`
            @keyframes langFadeDown {
              from { opacity: 0; transform: translateY(-6px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: "10px 14px 8px",
            fontSize: "10px",
            fontWeight: 800,
            color: "#94a3b8",
            letterSpacing: "1px",
            textTransform: "uppercase",
            borderBottom: "1px solid #f1f5f9",
          }}>
            Select Language
          </div>

          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = lang.code === language;
            const isDetected = lang.code === detectedLanguage && !isManualOverride;
            return (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "10px 14px",
                  background: isActive ? "#ccfbf1" : "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  borderBottom: "1px solid #f1f5f9",
                  gap: "8px",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = "#f1f5f9";
                }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = isActive ? "#ccfbf1" : "none";
                  }}
              >
                <div>
                  <span style={{ fontSize: "13px", fontWeight: isActive ? 700 : 400, color: isActive ? "#1a211e" : "#000000" }}>
                    {lang.nativeLabel}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "6px" }}>
                    {lang.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                  {isDetected && (
                    <span style={{
                      fontSize: "9px", fontWeight: 700,
                      background: "#fff3cd", color: "#856404",
                      padding: "1px 5px", borderRadius: "2px", letterSpacing: "0.3px",
                    }}>
                      AUTO
                    </span>
                  )}
                  {isActive && (
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#1a211e" strokeWidth="2.5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}