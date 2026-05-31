"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronRight, ArrowLeft, MessageSquare, Send, Sparkles, BookOpen, Loader2 } from "lucide-react";

interface GuideSection {
  id: string;
  icon: string;
  title: string;
  color: string;
  summary: string;
  content: string;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

type Tab = "topics" | "chat";

const SUGGESTIONS = [
  "Wie erstelle ich ein Projekt?",
  "Wie funktioniert ein A/B Test?",
  "Wie binde ich Prompts per API ein?",
  "Welche Rollen gibt es im Team?",
];

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "overview",
    icon: "🚀",
    title: "Was ist ProCon?",
    color: "from-indigo-500 to-purple-600",
    summary: "Überblick über die gesamte Plattform",
    content: `**ProCon** ist eine zentrale Plattform zur Verwaltung Ihrer KI-Prompts im Team.

Statt Prompts überall verstreut in Textdateien oder Chats zu haben, organisiert ProCon alles an einem Ort:

• **Versionierung** - Jede Änderung wird gespeichert, Sie können jederzeit zurück
• **Team-Zugriff** - Alle Mitglieder arbeiten mit denselben Prompts
• **API-Integration** - Rufen Sie Prompts direkt per REST-API aus Ihren Apps ab
• **A/B Testing** - Vergleichen Sie verschiedene Prompt-Varianten
• **Logs & Analytics** - Sehen Sie, wie oft und von wem Prompts genutzt werden

ProCon funktioniert als zentrales Prompt-Repository für Ihr Unternehmen.`,
  },
  {
    id: "projects",
    icon: "📁",
    title: "Projekte",
    color: "from-blue-500 to-indigo-600",
    summary: "Prompts in Projekten organisieren",
    content: `**Projekte** sind Ordner für Ihre Prompts - ähnlich wie Repositories in Git.

**Wie Sie Projekte nutzen:**

1. Erstellen Sie ein neues Projekt über den "+ Neues Projekt" Button
2. Vergeben Sie einen eindeutigen Namen (z.B. "HR", "Marketing", "Customer-Support")
3. Fügen Sie Beschreibung und Team-Mitglieder hinzu
4. Erstellen Sie Prompts innerhalb des Projekts

**Typische Projektstruktur:**
• HR - Bewerbungsgespräche, Onboarding-Texte
• Marketing - Produktbeschreibungen, Social-Media-Posts
• Support - FAQ-Antworten, Eskalations-Templates
• Development - Code-Review, Dokumentation

Jedes Projekt hat eigene Berechtigungen - Sie können festlegen, wer lesen und schreiben darf.`,
  },
  {
    id: "prompts",
    icon: "✏️",
    title: "Prompt-Editor",
    color: "from-violet-500 to-purple-600",
    summary: "Prompts erstellen und versionieren",
    content: `Der **Prompt-Editor** ist das Herzstück von ProCon.

**So erstellen Sie einen Prompt:**

1. Öffnen Sie ein Projekt → "+ Neuer Prompt"
2. Geben Sie einen Namen und Slug ein (z.B. "email-betreff")
3. Schreiben Sie Ihren Prompt-Text
4. Speichern - die Version wird automatisch angelegt

**Versionen:**
• Jedes Speichern erzeugt eine neue Version (v1, v2, v3...)
• Über "Versionshistorie" sehen Sie alle Änderungen mit Datum und Autor
• Klicken Sie auf eine Version, um sie wiederherzustellen

**Variablen:**
Nutzen Sie \`{{variable}}\` in Prompts, um dynamische Inhalte einzufügen.

Beispiel: "Schreibe eine E-Mail für {{customer_name}} zum Thema {{topic}}"

Die Variable wird beim API-Aufruf mit echten Werten ersetzt.`,
  },
  {
    id: "logs",
    icon: "📊",
    title: "Logs",
    color: "from-emerald-500 to-teal-600",
    summary: "API-Aufrufe und Nutzung verfolgen",
    content: `**Logs** zeigen Ihnen alle API-Aufrufe zu Ihren Prompts in Echtzeit.

**Was Sie in den Logs sehen:**

• **Zeitpunkt** - Wann wurde der Prompt aufgerufen?
• **Prompt** - Welcher Prompt wurde genutzt?
• **Antwortzeit** - Wie schnell hat die KI geantwortet? (in ms)
• **Status** - Erfolg ✅ oder Fehler ❌
• **Input/Output** - Was wurde gesendet, was kam zurück?

**Logs filtern:**
Oben finden Sie Filter nach Status, Zeitraum und Prompt-Name. So finden Sie schnell problematische Aufrufe.

**Warum Logs wichtig sind:**
• Fehler-Debugging: Sehen Sie genau, was schiefgelaufen ist
• Performance: Identifizieren Sie langsame Prompts
• Kosten-Kontrolle: Überwachen Sie die API-Nutzung`,
  },
  {
    id: "abtests",
    icon: "🧪",
    title: "A/B Tests",
    color: "from-amber-500 to-orange-600",
    summary: "Prompt-Varianten vergleichen",
    content: `**A/B Tests** helfen Ihnen herauszufinden, welche Prompt-Variante besser funktioniert.

**So richten Sie einen A/B Test ein:**

1. Gehen Sie zu "A/B Tests" → "+ Neuer Test"
2. Wählen Sie den Prompt, den Sie testen möchten
3. Definieren Sie **Variante A** (Original) und **Variante B** (Alternative)
4. Legen Sie die Gewichtung fest, z.B. **70/30** (70% A, 30% B)
5. Starten Sie den Test

**Was Sie messen:**
• Wie oft wird jede Variante aufgerufen?
• Welche erzielt bessere Ergebnisse (basierend auf Ihren Metriken)?
• Statistische Signifikanz - ist der Unterschied wirklich relevant?

**Beispiel:**
Testen Sie, ob ein freundlicher Ton ("Hallo, ich helfe Ihnen gerne!") besser funktioniert als ein direkter Ton ("Antwort: ...").`,
  },
  {
    id: "team",
    icon: "👥",
    title: "Team",
    color: "from-pink-500 to-rose-600",
    summary: "Mitglieder und Rollen verwalten",
    content: `Im **Team-Bereich** verwalten Sie, wer Zugriff auf ProCon hat und welche Rechte jeder hat.

**Rollen und Berechtigungen:**

| Rolle | Prompts lesen | Prompts bearbeiten | Team verwalten |
|-------|------|------|------|
| **Admin** | ✅ | ✅ | ✅ |
| **PM** | ✅ | ✅ | ❌ |
| **Developer** | ✅ | ✅ | ❌ |
| **Trainee** | ✅ | ❌ | ❌ |

**Mitglied einladen:**

1. "Team" → "+ Mitglied einladen"
2. E-Mail-Adresse eingeben
3. Rolle auswählen
4. Einladung senden - die Person erhält eine E-Mail

Das neue Mitglied kann sich registrieren und hat sofort Zugriff auf die zugewiesenen Projekte.`,
  },
  {
    id: "api",
    icon: "🔌",
    title: "API-Integration",
    color: "from-cyan-500 to-blue-600",
    summary: "Prompts in eigene Apps einbinden",
    content: `Nutzen Sie Ihre Prompts direkt in eigenen Anwendungen über die **REST-API**.

**API-Schlüssel:**
Gehen Sie zu Einstellungen → API-Keys → "+ Neuer Schlüssel"

**Prompt abrufen:**
\`\`\`
GET /api/v1/prompts/{slug}
Authorization: Bearer {ihr-api-key}
\`\`\`

**Antwort:**
\`\`\`json
{
  "slug": "email-betreff",
  "content": "Schreibe einen Betreff für...",
  "version": 3
}
\`\`\`

**Mit Variablen:**
\`\`\`
GET /api/v1/prompts/{slug}?customer_name=Max&topic=Rechnung
\`\`\`

**Einsatzbereiche:**
• In Python/Node.js Scripts
• In Ihrer eigenen Web-App
• In Automatisierungs-Tools (Zapier, Make)
• In GitHub Actions / CI/CD Pipelines`,
  },
  {
    id: "mcp",
    icon: "🤖",
    title: "MCP / KI-Tools",
    color: "from-purple-500 to-indigo-600",
    summary: "Integration in GitHub Copilot & Co.",
    content: `ProCon unterstützt das **Model Context Protocol (MCP)** - den Standard für KI-Tool-Integration.

**Was ist MCP?**
MCP erlaubt es KI-Assistenten wie GitHub Copilot, direkt auf Ihre ProCon-Prompts zuzugreifen.

**MCP einrichten:**

1. Einstellungen → MCP → "MCP aktivieren"
2. Kopieren Sie die MCP-Server-URL
3. In VS Code: Öffnen Sie Einstellungen → "mcp.servers"
4. Fügen Sie ProCon als MCP-Server hinzu

**Was dann möglich ist:**
• GitHub Copilot kann direkt Ihre gespeicherten Prompts verwenden
• Kein Kopieren/Einfügen von Prompts mehr nötig
• Prompts sind immer aktuell - automatisch synchronisiert

**Unterstützte KI-Tools:**
• GitHub Copilot (VS Code)
• Claude Desktop
• Cursor IDE
• Weitere MCP-kompatible Tools`,
  },
];

export function AiGuideChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("topics");
  const [activeSection, setActiveSection] = useState<GuideSection | null>(null);
  const [pulsing, setPulsing] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Stop pulsing after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setPulsing(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  function openPanel() {
    setIsOpen(true);
    setPulsing(false);
  }

  async function sendChat(text: string) {
    const trimmed = text.trim();
    if (!trimmed || chatLoading) return;

    const userMsg: ChatMsg = { role: "user", content: trimmed };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/guide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setChatMessages([...newMessages, { role: "assistant", content: data.reply ?? "Keine Antwort." }]);
    } catch {
      setChatMessages([
        ...newMessages,
        { role: "assistant", content: "Verbindung zum KI-Assistenten fehlgeschlagen." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="guide-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            width: "min(440px, calc(100vw - 3rem))",
            height: "min(640px, calc(100vh - 8rem))",
            animation: "slide-up 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b shrink-0"
            style={{ borderColor: "var(--panel-border)" }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {activeSection ? (
                <button
                  onClick={() => setActiveSection(null)}
                  aria-label="Zurück"
                  className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-black/6 dark:hover:bg-white/8 shrink-0"
                  style={{ color: "var(--text-3)" }}
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs shadow shrink-0">
                  PC
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                  {activeSection ? activeSection.title : "ProCon Guide"}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-4)" }}>
                  {activeSection ? activeSection.summary : "KI-Assistent & Themen-Übersicht"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Schließen"
              className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-black/6 dark:hover:bg-white/8 shrink-0"
              style={{ color: "var(--text-3)" }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs (only when no section detail) */}
          {!activeSection && (
            <div
              className="flex items-center gap-1 px-3 pt-2 pb-1 border-b shrink-0"
              style={{ borderColor: "var(--panel-border)" }}
            >
              <TabButton active={tab === "topics"} onClick={() => setTab("topics")} icon={<BookOpen className="h-3.5 w-3.5" />} label="Themen" />
              <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={<Sparkles className="h-3.5 w-3.5" />} label="KI-Chat" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {activeSection ? (
              <div className="flex-1 overflow-y-auto">
                <SectionDetail section={activeSection} />
              </div>
            ) : tab === "topics" ? (
              <div className="flex-1 overflow-y-auto">
                <SectionList onSelect={setActiveSection} onOpenChat={() => setTab("chat")} />
              </div>
            ) : (
              <ChatView
                messages={chatMessages}
                input={chatInput}
                loading={chatLoading}
                scrollRef={chatScrollRef}
                onInputChange={setChatInput}
                onSend={() => sendChat(chatInput)}
                onSuggestion={(s) => sendChat(s)}
                onClear={() => setChatMessages([])}
              />
            )}
          </div>
        </div>
      )}

      {/* Floating trigger button */}
      <button
        onClick={openPanel}
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 transition-all hover:scale-105 hover:shadow-indigo-500/60 active:scale-95"
        title="ProCon Guide öffnen"
      >
        {pulsing && (
          <span className="absolute inset-0 rounded-2xl bg-indigo-500 opacity-50 animate-ping" />
        )}
        {isOpen ? (
          <X className="h-5 w-5 relative z-10" />
        ) : (
          <span className="text-sm font-extrabold relative z-10">PC</span>
        )}
      </button>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300"
          : "hover:bg-black/5 dark:hover:bg-white/5"
      }`}
      style={!active ? { color: "var(--text-3)" } : {}}
    >
      {icon}
      {label}
    </button>
  );
}

function ChatView({
  messages,
  input,
  loading,
  scrollRef,
  onInputChange,
  onSend,
  onSuggestion,
  onClear,
}: {
  messages: ChatMsg[];
  input: string;
  loading: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onSuggestion: (s: string) => void;
  onClear: () => void;
}) {
  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {isEmpty ? (
          <div className="flex flex-col items-center text-center pt-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 mb-3">
              <Sparkles className="h-6 w-6" />
            </div>
            <p className="font-semibold text-sm mb-1" style={{ color: "var(--text-1)" }}>
              Fragen Sie mich alles
            </p>
            <p className="text-xs mb-5" style={{ color: "var(--text-3)" }}>
              Ich erkläre Funktionen, gebe Tipps und helfe bei der Nutzung.
            </p>
            <div className="w-full flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestion(s)}
                  className="text-left rounded-xl px-3 py-2.5 text-xs transition-colors hover:bg-indigo-500/8"
                  style={{ background: "var(--panel-bg-subtle)", border: "1px solid var(--panel-border)", color: "var(--text-2)" }}
                >
                  <span className="text-indigo-500 mr-1.5">›</span>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <ChatBubble key={i} message={m} />
            ))}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs flex items-center gap-2"
                  style={{ background: "var(--panel-bg-subtle)", color: "var(--text-3)" }}
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Denke nach...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 shrink-0" style={{ borderColor: "var(--panel-border)" }}>
        {!isEmpty && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-4)" }}>
              {messages.length} Nachricht{messages.length !== 1 ? "en" : ""}
            </span>
            <button
              onClick={onClear}
              className="text-[10px] uppercase tracking-wider hover:text-indigo-500 transition-colors"
              style={{ color: "var(--text-4)" }}
            >
              Zurücksetzen
            </button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
          className="flex items-end gap-2 rounded-xl p-1.5"
          style={{ background: "var(--panel-bg-subtle)", border: "1px solid var(--panel-border)" }}
        >
          <textarea
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Frage an den ProCon Guide..."
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm focus:outline-none disabled:opacity-50"
            style={{ color: "var(--text-1)", maxHeight: "100px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Nachricht senden"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30 transition-all hover:shadow-indigo-500/50 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </>
  );
}

function ChatBubble({ message }: { message: ChatMsg }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 text-xs max-w-[85%] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shrink-0">
        <Sparkles className="h-3.5 w-3.5" />
      </div>
      <div
        className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs max-w-[85%] leading-relaxed"
        style={{ background: "var(--panel-bg-subtle)", border: "1px solid var(--panel-border)", color: "var(--text-1)" }}
        dangerouslySetInnerHTML={{ __html: formatChatContent(message.content) }}
      />
    </div>
  );
}

function formatChatContent(text: string): string {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(99,102,241,0.12); padding: 1px 5px; border-radius: 4px; font-size: 11px;">$1</code>');
  html = html.replace(/\n/g, "<br/>");
  return html;
}

function SectionList({ onSelect, onOpenChat }: { onSelect: (s: GuideSection) => void; onOpenChat: () => void }) {
  return (
    <div className="p-3 flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest px-2 pt-1 pb-1" style={{ color: "var(--text-4)" }}>
        Themen-Übersicht
      </p>
      {GUIDE_SECTIONS.map((section) => (
        <button
          key={section.id}
          onClick={() => onSelect(section)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left w-full transition-colors hover:bg-black/5 dark:hover:bg-white/5 group"
        >
          <span className="text-xl shrink-0">{section.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
              {section.title}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--text-4)" }}>
              {section.summary}
            </p>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
            style={{ color: "var(--text-3)" }}
          />
        </button>
      ))}

      {/* Footer: switch to chat */}
      <button
        onClick={onOpenChat}
        className="mt-2 rounded-xl px-3 py-3 flex items-start gap-2.5 text-left transition-all hover:scale-[1.01]"
        style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.10), rgba(168,85,247,0.10))", border: "1px solid rgba(99,102,241,0.20)" }}
      >
        <MessageSquare className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>
            Lieber eine Frage stellen?
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
            Wechseln Sie zum KI-Chat und fragen Sie alles über ProCon.
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
      </button>
    </div>
  );
}

function SectionDetail({ section }: { section: GuideSection }) {
  const lines = section.content.split("\n");

  return (
    <div className="p-4">
      {/* Section icon header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${section.color} text-2xl shadow-lg`}
        >
          {section.icon}
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>
            {section.title}
          </p>
          <p className="text-xs" style={{ color: "var(--text-4)" }}>
            {section.summary}
          </p>
        </div>
      </div>

      {/* Formatted content */}
      <div className="space-y-1.5">
        {lines.map((line, i) => {
          if (line.trim() === "") return <div key={i} className="h-1.5" />;

          // Table rows
          if (line.startsWith("|")) {
            const cells = line.split("|").filter((c) => c.trim() !== "");
            const isDivider = cells.every((c) => c.trim().match(/^[-:]+$/));
            if (isDivider) return null;
            return (
              <div key={i} className="flex gap-2 text-xs">
                {cells.map((cell, j) => (
                  <span
                    key={j}
                    className="flex-1"
                    style={{ color: j === 0 ? "var(--text-2)" : "var(--text-3)" }}
                    dangerouslySetInnerHTML={{ __html: formatInline(cell.trim()) }}
                  />
                ))}
              </div>
            );
          }

          // Code blocks
          if (line.startsWith("```")) return null;

          // Bullet points
          if (line.startsWith("• ") || line.startsWith("- ")) {
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
                <span
                  style={{ color: "var(--text-3)" }}
                  dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^[•-]\s/, "")) }}
                />
              </div>
            );
          }

          // Numbered list
          if (/^\d+\./.test(line)) {
            const [num, ...rest] = line.split(". ");
            return (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span
                  className="font-semibold shrink-0 mt-0.5 flex h-4 w-4 items-center justify-center rounded-full text-white text-[10px]"
                  style={{ background: "var(--primary)" }}
                >
                  {num}
                </span>
                <span
                  style={{ color: "var(--text-3)" }}
                  dangerouslySetInnerHTML={{ __html: formatInline(rest.join(". ")) }}
                />
              </div>
            );
          }

          // Code snippet line
          if (line.startsWith("`")) {
            return (
              <code
                key={i}
                className="block text-xs rounded-lg px-3 py-2 font-mono"
                style={{
                  background: "var(--panel-bg-subtle)",
                  border: "1px solid var(--panel-border)",
                  color: "var(--primary-light)",
                }}
              >
                {line.replace(/`/g, "")}
              </code>
            );
          }

          // Bold heading (line starts with **)
          if (line.startsWith("**")) {
            const text = line.replace(/\*\*/g, "");
            return (
              <p key={i} className="text-sm font-semibold mt-2" style={{ color: "var(--text-1)" }}>
                {text}
              </p>
            );
          }

          // Regular paragraph
          return (
            <p
              key={i}
              className="text-xs leading-relaxed"
              style={{ color: "var(--text-3)" }}
              dangerouslySetInnerHTML={{ __html: formatInline(line) }}
            />
          );
        })}
      </div>
    </div>
  );
}

function formatInline(text: string): string {
  // Bold
  return text.replace(/\*\*(.+?)\*\*/g, '<strong style="color: var(--text-2)">$1</strong>');
}
