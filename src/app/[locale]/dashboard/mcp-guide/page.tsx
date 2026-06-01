import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import {
  BookOpen,
  Terminal,
  Key,
  CheckCircle,
  Code2,
  Zap,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "MCP Guide - ProCon" };
}

function CodeBlock({ code, lang = "json" }: { code: string; lang?: string }) {
  return (
    <div className="relative group">
      <pre className="panel rounded-xl p-4 text-xs font-mono text-t2 overflow-x-auto leading-relaxed">
        <code data-lang={lang}>{code}</code>
      </pre>
    </div>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white bg-indigo-500">
          {number}
        </div>
        <div className="mt-2 flex-1 w-px bg-indigo-500/20" />
      </div>
      <div className="pb-8 flex-1 min-w-0">
        <h3 className="text-base font-bold text-t1 mb-3">{title}</h3>
        <div className="space-y-3 text-sm text-t2 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

export default async function McpGuidePage() {
  await getTranslations("nav");

  const vscodeMcpConfig = `{
  "servers": {
    "procon": {
      "type": "http",
      "url": "https://ihre-domain.vercel.app/api/mcp",
      "headers": {
        "X-Api-Key": "IHR_API_SCHLÜSSEL"
      }
    }
  }
}`;

  const ideaMcpConfig = `{
  "mcpServers": {
    "procon": {
      "url": "https://ihre-domain.vercel.app/api/mcp",
      "headers": {
        "X-Api-Key": "IHR_API_SCHLÜSSEL"
      }
    }
  }
}`;

  const exampleQuery = `@procon list_prompts

@procon get_prompt customer-service-de

@procon search_prompts onboarding`;

  const restExample = `# Prompt abrufen (kein MCP-Client erforderlich)
curl -H "X-Api-Key: IHR_API_SCHLÜSSEL" \\
  https://ihre-domain.vercel.app/api/v1/prompts/SLUG

# Antwort:
{
  "id": "...",
  "name": "Kunden-Service DE",
  "slug": "customer-service-de",
  "content": "Sie sind ein hilfreicher Kundenservice-Assistent...",
  "status": "active",
  "current_version": 3
}`;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold text-indigo-500"
          style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.07)" }}
        >
          <Zap className="h-3.5 w-3.5" />
          MCP - Model Context Protocol
        </div>
        <h1 className="text-3xl font-bold text-t1 mb-3">
          ProCon in Ihre IDE einbinden
        </h1>
        <p className="text-base text-t3 leading-relaxed">
          Greifen Sie direkt aus GitHub Copilot, Cursor, JetBrains IDEA oder Claude Desktop auf alle
          Ihre Unternehmens-Prompts zu - ohne Copy &amp; Paste, immer mit der aktuellsten Version.
        </p>
      </div>

      {/* What is MCP */}
      <div className="panel rounded-2xl p-6 mb-10">
        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(99,102,241,0.12)" }}
          >
            <BookOpen className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-t1 mb-1">Was ist MCP?</h2>
            <p className="text-sm text-t3 leading-relaxed">
              Das <strong>Model Context Protocol (MCP)</strong> ist ein offener Standard von Anthropic,
              der es KI-Assistenten erlaubt, externe Datenquellen und Tools sicher zu nutzen.
              ProCon implementiert einen MCP-Server, der Ihre Prompts als abrufbare Ressourcen
              bereitstellt - direkt in Ihrem KI-Assistenten verfügbar.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div>
        {/* Step 1: API Key */}
        <Step number={1} title="API-Schlüssel kopieren">
          <p>
            Gehen Sie zu{" "}
            <strong>Profil &rarr; Integrationen</strong> und kopieren Sie Ihren persönlichen API-Schlüssel.
            Er wird automatisch für Ihr Konto generiert.
          </p>

          {/* CTA to integrations tab */}
          <div className="mt-3">
            <a
              href="/dashboard/profile?tab=integrations"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-600 transition-colors"
            >
              <Key className="h-4 w-4" /> Zu Profil → Integrationen
            </a>
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/7 px-4 py-3 mt-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Behandeln Sie den API-Schlüssel wie ein Passwort. Nie in Git committen.
              Fügen Sie ihn in <code>.vscode/mcp.json</code> ein und schließen Sie die Datei per{" "}
              <code>.gitignore</code> vom Repository aus.
            </p>
          </div>
        </Step>

        {/* Step 2: VS Code */}
        <Step number={2} title="VS Code / GitHub Copilot einrichten">
          <p>
            Erstellen Sie die Datei{" "}
            <code className="text-xs bg-black/5 dark:bg-white/8 rounded px-1.5 py-0.5">.vscode/mcp.json</code>{" "}
            im Projekt-Root und fügen Sie Ihren API-Schlüssel ein:
          </p>
          <CodeBlock code={vscodeMcpConfig} />
          <div className="flex items-start gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/7 px-4 py-3">
            <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-600 dark:text-indigo-400">
              Für lokale Entwicklung verwenden Sie{" "}
              <code>http://localhost:3000/api/mcp</code> als URL.
              Für Production tragen Sie Ihre Vercel-URL ein.
            </p>
          </div>
          <p className="mt-2">
            VS Code neu starten. In GitHub Copilot Chat tippen Sie dann:
          </p>
          <CodeBlock code={exampleQuery} lang="bash" />
        </Step>

        {/* Step 3: JetBrains IDEA */}
        <Step number={3} title="JetBrains IDEA (IntelliJ, WebStorm, etc.)">
          <p>
            In JetBrains IDEs mit dem <strong>AI Assistant Plugin</strong> (ab Version 2024.2):
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-sm text-t2">
            <li>
              <strong>Settings</strong> &rarr; <strong>Tools</strong> &rarr;{" "}
              <strong>AI Assistant</strong> &rarr; <strong>MCP Servers</strong>
            </li>
            <li>Klicken Sie auf <strong>Add Server</strong> und wählen Sie <strong>HTTP</strong></li>
            <li>Tragen Sie Ihre ProCon-URL und den API-Schlüssel ein</li>
          </ol>
          <p className="mt-3">
            Oder via{" "}
            <code className="text-xs bg-black/5 dark:bg-white/8 rounded px-1.5 py-0.5">
              ~/.config/mcp/config.json
            </code>
            :
          </p>
          <CodeBlock code={ideaMcpConfig} />
        </Step>

        {/* Step 4: Claude Desktop */}
        <Step number={4} title="Claude Desktop einrichten">
          <p>Bearbeiten Sie die Claude-Konfigurationsdatei:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-t3">
            <li>
              <strong>macOS:</strong>{" "}
              <code className="text-xs bg-black/5 dark:bg-white/8 rounded px-1.5 py-0.5">
                ~/Library/Application Support/Claude/claude_desktop_config.json
              </code>
            </li>
            <li>
              <strong>Windows:</strong>{" "}
              <code className="text-xs bg-black/5 dark:bg-white/8 rounded px-1.5 py-0.5">
                %APPDATA%\Claude\claude_desktop_config.json
              </code>
            </li>
          </ul>
          <CodeBlock code={ideaMcpConfig} />
          <p>Claude Desktop nach der Änderung neu starten.</p>
        </Step>

        {/* Step 5: REST API */}
        <Step number={5} title="Direkter REST-API-Zugriff (ohne MCP-Client)">
          <p>
            Für Anwendungen ohne MCP-Unterstützung: Alle Prompts sind auch per einfacher REST-API
            abrufbar - kein spezieller Client erforderlich.
          </p>
          <CodeBlock code={restExample} lang="bash" />
        </Step>
      </div>

      {/* Available tools */}
      <div className="panel rounded-2xl p-6 mt-6">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="h-5 w-5 text-indigo-500" />
          <h2 className="text-base font-bold text-t1">Verfügbare MCP-Tools</h2>
        </div>
        <div className="space-y-3">
          {[
            {
              tool: "list_prompts",
              desc: "Alle aktiven Prompts Ihrer Organisation abrufen. Optional: project_id oder category.",
            },
            {
              tool: "get_prompt",
              desc: "Einen einzelnen Prompt per Slug abrufen. Gibt Inhalt, Version und Metadaten zurück.",
            },
            {
              tool: "search_prompts",
              desc: "Prompts nach Stichwort durchsuchen (Name, Beschreibung, Inhalt).",
            },
          ].map(({ tool, desc }) => (
            <div
              key={tool}
              className="flex items-start gap-3 rounded-xl border border-indigo-500/15 bg-indigo-500/5 px-4 py-3"
            >
              <Code2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <code className="text-sm font-mono font-bold text-indigo-500">{tool}</code>
                <p className="text-xs text-t3 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security note */}
      <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/7 px-4 py-3">
        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-600 dark:text-emerald-400">
          <strong>Sicherheit:</strong> Der MCP-Server gibt ausschließlich Prompts mit Status{" "}
          <strong>Aktiv</strong> zurück, die der Organisation des API-Schlüssel-Inhabers gehören.
          Prompts anderer Organisationen sind nicht zugänglich.
        </div>
      </div>

      {/* External links */}
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="https://modelcontextprotocol.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-indigo-500 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> MCP Dokumentation
        </a>
        <a
          href="https://code.visualstudio.com/docs/copilot/chat/mcp-servers"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-indigo-500 hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> VS Code MCP Guide
        </a>
      </div>
    </div>
  );
}
