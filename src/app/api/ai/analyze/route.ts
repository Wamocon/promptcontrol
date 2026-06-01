import { type NextRequest, NextResponse } from "next/server";
import { autoChat } from "@/lib/ai/client";
import { PROVIDERS } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.prompt) {
    return NextResponse.json({ error: "prompt field required" }, { status: 400 });
  }

  const messages = [
    {
      role: "system" as const,
      content:
        "Du bist ein Experte für Prompt Engineering. Analysiere den folgenden Prompt nach diesen Kriterien: " +
        "1. Klarheit und Präzision, 2. Rollenangabe, 3. Ausgabeformat, " +
        "4. DSGVO-Konformität, 5. Verbesserungsvorschläge. " +
        "Antworte auf Deutsch, strukturiert mit Markdown.",
    },
    {
      role: "user" as const,
      content: `Prompt Name: ${body.name ?? "Unbekannt"}\n\nPrompt Inhalt:\n${body.prompt}`,
    },
  ];

  try {
    const { text, provider, model } = await autoChat(messages, { maxTokens: 600, temperature: 0.3 });
    const providerLabel = PROVIDERS[provider]?.label ?? provider;
    return NextResponse.json({ analysis: text, provider: providerLabel, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    // Fallback: static analysis if AI not reachable
    return NextResponse.json({
      analysis:
        `**Prompt-Qualitätsanalyse (offline):**\n\n` +
        `Der Prompt enthält ${body.prompt.length} Zeichen.\n\n` +
        `**Hinweis:** KI-Analyse nicht verfügbar: ${message}\n\n` +
        `**Empfehlungen:**\n` +
        `- Klare Rollenangabe zu Beginn (z.B. "Sie sind ein...")\n` +
        `- Konkrete Aufgabenstellung\n` +
        `- Erwartetes Ausgabeformat angeben\n` +
        `- Beispiele wenn möglich einfügen`,
      error: message,
    });
  }
}

