"use client";
import { useEffect, useState } from "react";

export type SmileyMood = "empty" | "content" | "happy" | "ecstatic";

const MOUTH_PATHS: Record<SmileyMood, string> = {
  empty:    "M 34 64 Q 50 52 66 64",   // gentle frown
  content:  "M 34 56 Q 50 61 66 56",   // soft smile
  happy:    "M 32 54 Q 50 74 68 54",   // big open smile
  ecstatic: "M 28 50 Q 50 80 72 50",   // biggest, widest smile
};

const INK = "#1a211e";

export function CartSmiley({
  mood,
  size = 72,
  className = "",
}: {
  mood: SmileyMood;
  size?: number;
  className?: string;
}) {
  const [blink, setBlink] = useState(false);
  const [pop, setPop] = useState(false);

  // Periodic idle blink so the face feels alive, not static
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2800 + Math.random() * 2400;
      return setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        timer = scheduleBlink();
      }, delay);
    };
    let timer = scheduleBlink();
    return () => clearTimeout(timer);
  }, []);

  // Small pop animation whenever mood changes (e.g. item added/removed)
  useEffect(() => {
    setPop(true);
    const t = setTimeout(() => setPop(false), 260);
    return () => clearTimeout(t);
  }, [mood]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      style={{
        display: "block",
        transform: pop ? "scale(1.12)" : "scale(1)",
        transition: "transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
    >
      <circle cx="50" cy="50" r="46" fill="#eef1f0" stroke="#cccfcd" strokeWidth="2" />

      {mood === "ecstatic" && (
        <>
          <path d="M 26 30 Q 34 23 42 29" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M 58 29 Q 66 23 74 30" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {mood === "empty" && (
        <>
          <path d="M 28 33 Q 35 38 42 34" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
          <path d="M 58 34 Q 65 38 72 33" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5" />
        </>
      )}

      <ellipse cx="35" cy="42" rx="4.5" ry={blink ? 0.5 : 5} fill={INK} style={{ transition: "ry 0.09s ease" }} />
      <ellipse cx="65" cy="42" rx="4.5" ry={blink ? 0.5 : 5} fill={INK} style={{ transition: "ry 0.09s ease" }} />

      <path d={MOUTH_PATHS[mood]} stroke={INK} strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {mood === "ecstatic" && (
        <>
          <text x="10" y="28" fontSize="13">✨</text>
          <text x="80" y="22" fontSize="11">✨</text>
          <text x="82" y="70" fontSize="11">✨</text>
        </>
      )}
    </svg>
  );
}

/** Derive a mood from cart state — tweak thresholds to taste. */
export function getCartMood(itemCount: number, totalSavings: number): SmileyMood {
  if (itemCount === 0) return "empty";
  if (totalSavings >= 1000) return "ecstatic";
  if (itemCount >= 3) return "happy";
  return "content";
}