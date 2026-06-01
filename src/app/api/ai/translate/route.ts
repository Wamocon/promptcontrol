import { type NextRequest, NextResponse } from "next/server";
import { autoChat } from "@/lib/ai/client";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body?.content || !body?.targetLang) {
    return NextResponse.json({ error: "content and targetLang fields required" }, { status: 400 });
  }

  const { content, targetLang } = body as { content: string; targetLang: "de" | "en" };

  const langLabel = targetLang === "de" ? "Deutsch" : "English";
  const instruction =
    targetLang === "de"
      ? "Translate the following AI prompt from English to German. Keep all technical terms, placeholders (like {variable}), and Markdown formatting intact. Return only the translated prompt text, nothing else."
      : "Translate the following AI prompt from German to English. Keep all technical terms, placeholders (like {variable}), and Markdown formatting intact. Return only the translated prompt text, nothing else.";

  const messages = [
    {
      role: "system" as const,
      content: instruction,
    },
    {
      role: "user" as const,
      content,
    },
  ];

  try {
    const { text, provider, model } = await autoChat(messages, {
      maxTokens: 2000,
      temperature: 0.1,
    });
    return NextResponse.json({ translatedContent: text, provider, model, targetLang });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Translation to ${langLabel} failed: ${message}` },
      { status: 503 }
    );
  }
}
