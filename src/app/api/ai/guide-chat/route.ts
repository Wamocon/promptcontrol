import { type NextRequest, NextResponse } from "next/server";
import { autoChat, type ChatMessage } from "@/lib/ai/client";

const SYSTEM_PROMPT = `Du bist der ProCon Guide – ein freundlicher KI-Assistent, der Nutzern erklärt, wie sie die ProCon-Plattform verwenden.

Über ProCon:
- ProCon ist eine zentrale Plattform zur Verwaltung von KI-Prompts für Teams
- Hauptfunktionen: Projekte, Prompts mit Versionierung, Logs, A/B-Tests, Team-Verwaltung, REST-API, MCP-Integration

Verfügbare App-Bereiche:
- Dashboard: Übersicht mit KPIs (Gesamt-Prompts, Projekte, API-Aufrufe, Teammitglieder)
- Projekte: Ordner für Prompts (z.B. HR, Marketing, Support)
- Prompts: Erstellen, bearbeiten, versionieren mit {{variablen}}
- Logs: Alle API-Aufrufe mit Zeitstempel, Status, Antwortzeit
- A/B Tests: Vergleich zweier Prompt-Varianten mit Gewichtung (z.B. 70/30)
- Team: Rollen (Admin, PM, Developer, Trainee), Einladungen per E-Mail
- API: REST-Endpoint GET /api/v1/prompts/{slug} mit Bearer-Token
- MCP: Integration in GitHub Copilot, Claude Desktop, Cursor IDE

Verhalten:
- Antworte IMMER auf Deutsch
- Halte Antworten kurz (max. 3-4 kurze Absätze)
- Nutze Markdown (fett mit **, Listen mit -)
- Bei spezifischen Fragen zur App: gib konkrete Klick-Anleitungen
- Bei Fragen außerhalb von ProCon: höflich auf den Fokus zurückführen
- Wenn du etwas nicht weißt, sage es ehrlich`;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || !Array.isArray(body.messages)) {
    return NextResponse.json({ error: "messages field required" }, { status: 400 });
  }

  // Validate messages
  const userMessages = body.messages as ChatMessage[];
  if (userMessages.length === 0 || userMessages.length > 20) {
    return NextResponse.json({ error: "1-20 messages allowed" }, { status: 400 });
  }

  const validRoles = ["user", "assistant"];
  for (const m of userMessages) {
    if (!validRoles.includes(m.role) || typeof m.content !== "string" || m.content.length > 2000) {
      return NextResponse.json({ error: "invalid message format" }, { status: 400 });
    }
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...userMessages,
  ];

  try {
    const { text, provider, model } = await autoChat(messages, {
      maxTokens: 400,
      temperature: 0.5,
    });
    return NextResponse.json({ reply: text, provider, model });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json(
      {
        reply:
          "Entschuldigung, der KI-Assistent ist gerade nicht erreichbar. Bitte versuchen Sie es später erneut oder nutzen Sie die Themen-Übersicht.",
        error: message,
      },
      { status: 200 } // status 200 so client can display the fallback message
    );
  }
}
