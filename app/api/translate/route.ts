import { NextRequest, NextResponse } from "next/server";

// POST /api/translate
// body: { strings: Record<string, string>, targetLanguage: string }
// returns: { translations: Record<string, string> }

export async function POST(req: NextRequest) {
  const { strings, targetLanguage } = await req.json();

  if (!strings || !targetLanguage) {
    return NextResponse.json({ error: "Missing strings or targetLanguage" }, { status: 400 });
  }

  // If English, return as-is
  if (targetLanguage === "en") {
    return NextResponse.json({ translations: strings });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  const languageNames: Record<string, string> = {
    hi: "Hindi",
    bn: "Bengali",
    ta: "Tamil",
    te: "Telugu",
    mr: "Marathi",
    gu: "Gujarati",
    kn: "Kannada",
    ml: "Malayalam",
    pa: "Punjabi (Gurmukhi script)",
    ur: "Urdu",
  };

  const langName = languageNames[targetLanguage] || targetLanguage;

  // Prepare the JSON payload of strings to translate
  const stringPayload = JSON.stringify(strings, null, 2);

  const prompt = `You are a translation engine for an Indian e-commerce website (like Flipkart).
Translate the following JSON object values from English to ${langName}.
Keep JSON keys exactly the same. Only translate the values.
Preserve any placeholders like {name}, ₹, numbers, and brand names as-is.
Return ONLY valid JSON — no explanation, no markdown, no code fences.

Input JSON:
${stringPayload}`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq API error:", err);
      return NextResponse.json({ translations: strings }); // fallback to English
    }

    const groqData = await groqRes.json();
    const raw = groqData.choices?.[0]?.message?.content?.trim() ?? "{}";

    // Strip markdown code fences if model adds them
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let translations: Record<string, string>;
    try {
      translations = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Groq translation JSON, falling back to English");
      translations = strings;
    }

    return NextResponse.json({ translations });
  } catch (e) {
    console.error("Translation fetch error:", e);
    return NextResponse.json({ translations: strings }); // graceful fallback
  }
}