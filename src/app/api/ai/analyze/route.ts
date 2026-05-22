import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.prompt) {
    return NextResponse.json({ error: "prompt field required" }, { status: 400 });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || openaiKey === "sk-placeholder") {
    return NextResponse.json({
      analysis: `**Prompt-Qualitätsanalyse:**\n\nDer Prompt enthält ${body.prompt.length} Zeichen. Für eine vollständige KI-Analyse konfigurieren Sie bitte den OPENAI_API_KEY.\n\n**Empfehlungen:**\n- Klare Rollenangabe zu Beginn (z.B. "Sie sind ein...")\n- Konkrete Aufgabenstellung\n- Erwartetes Ausgabeformat angeben\n- Beispiele wenn möglich einfügen`,
    });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Du bist ein Experte für Prompt Engineering. Analysiere den folgenden Prompt nach diesen Kriterien: 1. Klarheit und Präzision, 2. Rollenangabe, 3. Ausgabeformat, 4. DSGVO-Konformität, 5. Verbesserungsvorschläge. Antworte auf Deutsch und strukturiert.",
          },
          { role: "user", content: `Prompt Name: ${body.name}\n\nPrompt Inhalt:\n${body.prompt}` },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content ?? "Analyse nicht verfügbar.";
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ analysis: "KI-Analyse fehlgeschlagen. Bitte versuchen Sie es erneut." });
  }
}
