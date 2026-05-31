"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  Plus,
  FileText,
  ChevronLeft,
  Save,
  Copy,
  Check,
  AlertTriangle,
  Brain,
  Download,
  RotateCcw,
  Trash2,
  Shield,
  GitBranch,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import {
  createPrompt,
  updatePrompt,
  deletePrompt,
  rollbackVersion,
} from "./actions";
import { formatDate } from "@/lib/utils";
import type { Project, Prompt, PromptCategory, PromptVersion } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface PromptsClientProps {
  project: Project;
  initialPrompts: (Prompt & { prompt_categories?: PromptCategory | null })[];
  categories: PromptCategory[];
}

export function PromptsClient({ project, initialPrompts, categories }: PromptsClientProps) {
  const t = useTranslations("prompts");

  const [prompts] = useState(initialPrompts);
  const [selectedPrompt, setSelectedPrompt] = useState<typeof initialPrompts[0] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Compliance state
  const [complianceResult, setComplianceResult] = useState<{ clean: boolean; issues: string[] } | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  // Versions panel
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Editor state for selected prompt
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<string>("draft");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [changeNote, setChangeNote] = useState("");

  function selectPrompt(prompt: typeof initialPrompts[0]) {
    setSelectedPrompt(prompt);
    setEditContent(prompt.content);
    setEditName(prompt.name);
    setEditDescription(prompt.description ?? "");
    setEditStatus(prompt.status);
    setEditCategoryId(prompt.category_id ?? "");
    setAiAnalysis(null);
    setComplianceResult(null);
    setShowVersions(false);
    setVersions([]);
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createPrompt(project.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowCreate(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  function handleSave(saveAsVersion: boolean) {
    if (!selectedPrompt) return;
    const formData = new FormData();
    formData.set("name", editName);
    formData.set("content", editContent);
    formData.set("description", editDescription);
    formData.set("status", editStatus);
    formData.set("category_id", editCategoryId);
    formData.set("change_note", changeNote);

    startTransition(async () => {
      const result = await updatePrompt(selectedPrompt.id, project.id, formData, saveAsVersion);
      if (result.error) {
        setError(result.error);
      } else {
        setChangeNote("");
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deletePrompt(deleteId, project.id);
      setDeleteId(null);
      setSelectedPrompt(null);
    });
  }

  async function handleCopy() {
    if (!editContent) return;
    await navigator.clipboard.writeText(editContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleExport(type: "instruction" | "skill") {
    if (!selectedPrompt) return;
    const header = type === "instruction"
      ? `---\napplyTo: "**/*"\n---\n# ${editName}\n\n`
      : `---\nname: ${editName.toLowerCase().replace(/\s+/g, "-")}\ndescription: "${editDescription || editName}"\n---\n# ${editName}\n\n`;
    const content = header + editContent;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = type === "instruction" ? `${selectedPrompt.slug}.instructions.md` : `${selectedPrompt.slug}.skill.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleComplianceCheck() {
    if (!editContent) return;
    setComplianceLoading(true);
    setComplianceResult(null);

    // Local PII detection patterns
    const piiPatterns = [
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: "E-Mail-Adresse" },
      { pattern: /\b\d{3,4}[-\s]?\d{6,7}\b/g, label: "Telefonnummer" },
      { pattern: /\b(?:IBAN|iban)[:\s]*[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/g, label: "IBAN" },
      { pattern: /\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g, label: "Kreditkartennummer" },
      { pattern: /\bgeboren(?:am|en)?\s+\d{1,2}\.\d{1,2}\.\d{4}\b/gi, label: "Geburtsdatum" },
      { pattern: /\bpassword\s*[:=]\s*\S+/gi, label: "Passwort im Klartext" },
      { pattern: /\bapi[_\s-]?key\s*[:=]\s*\S+/gi, label: "API-Schlüssel" },
    ];

    const issues: string[] = [];
    piiPatterns.forEach(({ pattern, label }) => {
      if (pattern.test(editContent)) issues.push(label);
    });

    setTimeout(() => {
      setComplianceResult({ clean: issues.length === 0, issues });
      setComplianceLoading(false);
    }, 800);
  }

  async function handleAiAnalysis() {
    if (!editContent || !selectedPrompt) return;
    setAiLoading(true);
    setAiAnalysis(null);

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: editContent, name: editName }),
      });
      const data = await response.json();
      setAiAnalysis(data.analysis ?? "Analyse nicht verfügbar.");
    } catch {
      setAiAnalysis("Fehler bei der KI-Analyse. Bitte überprüfen Sie den OpenAI API-Schlüssel.");
    }
    setAiLoading(false);
  }

  async function loadVersions() {
    if (!selectedPrompt) return;
    setVersionsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("prompt_versions")
      .select("*")
      .eq("prompt_id", selectedPrompt.id)
      .order("version", { ascending: false });
    setVersions((data as PromptVersion[]) ?? []);
    setVersionsLoading(false);
  }

  function handleShowVersions() {
    setShowVersions(true);
    loadVersions();
  }

  function handleRollback(versionId: string) {
    if (!selectedPrompt) return;
    startTransition(async () => {
      await rollbackVersion(selectedPrompt.id, project.id, versionId);
      setShowVersions(false);
    });
  }

  const filteredPrompts =
    filterCategory === "all"
      ? prompts
      : prompts.filter((p) => p.category_id === filterCategory);

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge variant="success">Aktiv</Badge>;
    if (status === "archived") return <Badge variant="default">Archiviert</Badge>;
    return <Badge variant="warning">Entwurf</Badge>;
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel: prompt list */}
      <div
        className="w-72 shrink-0 border-r flex flex-col"
        style={{ background: "var(--panel-bg)", borderColor: "var(--panel-border)", backdropFilter: "blur(16px)" }}
      >
        {/* Project header */}
        <div className="border-b px-4 py-3.5" style={{ borderColor: "var(--panel-border)" }}>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1 text-xs text-t3 hover:text-t1 mb-2 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" /> Alle Projekte
          </Link>
          <h2 className="font-semibold text-t1 truncate">{project.name}</h2>
        </div>

        {/* Category filter */}
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--panel-border)" }}>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-glass text-xs py-1.5 [&>option]:bg-[--input] [&>option]:text-[--foreground]"
          >
            <option value="all">Alle Kategorien</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Add button */}
        <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--panel-border)" }}>
          <Button size="sm" onClick={() => setShowCreate(true)} className="w-full">
            <Plus className="h-3.5 w-3.5" /> Neuer Prompt
          </Button>
        </div>

        {/* Prompt list */}
        <div className="flex-1 overflow-y-auto">
          {filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-t4 text-sm">
              <FileText className="h-8 w-8 mb-2" />
              Noch keine Prompts
            </div>
          ) : (
            filteredPrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => selectPrompt(prompt)}
                className={`w-full text-left px-4 py-3 border-b transition-all ${
                  selectedPrompt?.id === prompt.id
                    ? "bg-indigo-500/10 border-l-2 border-l-indigo-500"
                    : "hover:bg-black/3 dark:hover:bg-white/3"
                }`}
                style={{ borderBottomColor: "var(--panel-border)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-t1 truncate">{prompt.name}</span>
                  {statusBadge(prompt.status)}
                </div>
                {prompt.prompt_categories && (
                  <span className="text-xs" style={{ color: prompt.prompt_categories.color }}>
                    {prompt.prompt_categories.name}
                  </span>
                )}
                <p className="text-xs text-t4 mt-0.5">{formatDate(prompt.updated_at)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: editor */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
        {selectedPrompt ? (
          <>
            {/* Toolbar */}
            <div
              className="flex items-center gap-1.5 border-b px-4 py-2.5"
              style={{ background: "var(--panel-bg-subtle)", borderColor: "var(--panel-border)", backdropFilter: "blur(16px)" }}
            >
              <span className="flex-1 text-sm font-semibold text-t1 truncate">{editName}</span>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/6 hover:text-t1 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Kopiert" : "Kopieren"}
              </button>

              <button
                onClick={handleComplianceCheck}
                disabled={complianceLoading}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-amber-500 hover:bg-amber-400/8 hover:text-amber-600 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                {complianceLoading ? "Prüfe..." : "Compliance"}
              </button>

              <button
                onClick={handleAiAnalysis}
                disabled={aiLoading}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-indigo-500 hover:bg-indigo-400/8 hover:text-indigo-600 transition-colors"
              >
                <Brain className="h-3.5 w-3.5" />
                {aiLoading ? "Analysiert..." : "KI-Analyse"}
              </button>

              <button
                onClick={handleShowVersions}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/6 hover:text-t1 transition-colors"
              >
                <GitBranch className="h-3.5 w-3.5" /> Versionen
              </button>

              <div className="relative group">
                <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/6 hover:text-t1 transition-colors">
                  <Download className="h-3.5 w-3.5" /> Export
                </button>
                <div className="absolute right-0 top-9 z-10 hidden group-hover:block w-48 panel p-1 shadow-2xl">
                  <button onClick={() => handleExport("instruction")} className="w-full text-left rounded-lg px-3 py-2 text-sm text-t2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors">Als instruction.md</button>
                  <button onClick={() => handleExport("skill")} className="w-full text-left rounded-lg px-3 py-2 text-sm text-t2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors">Als skill.md</button>
                </div>
              </div>

              <button
                onClick={() => setDeleteId(selectedPrompt.id)}
                className="rounded-lg p-1.5 text-t4 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <Button size="sm" variant="secondary" onClick={() => handleSave(false)} loading={isPending}>
                <Save className="h-3.5 w-3.5" /> Speichern
              </Button>
              <Button size="sm" onClick={() => handleSave(true)} loading={isPending}>
                + Version
              </Button>
            </div>

            {/* Compliance result */}
            {complianceResult && (
              <div
                className={`mx-4 mt-3 rounded-xl px-4 py-3 text-sm flex items-start gap-2 border ${
                  complianceResult.clean
                    ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-500"
                    : "border-rose-500/25 bg-rose-500/8 text-rose-500"
                }`}
              >
                {complianceResult.clean ? (
                  <><Check className="h-4 w-4 mt-0.5 shrink-0" /> {t("complianceClean")}</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {t("complianceIssues")}: {complianceResult.issues.join(", ")}</>
                )}
                <button onClick={() => setComplianceResult(null)} className="ml-auto opacity-50 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            {/* AI analysis result */}
            {aiAnalysis && (
              <div className="mx-4 mt-3 rounded-xl border border-indigo-500/20 p-4" style={{ background: "rgba(99,102,241,0.07)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-indigo-500">{t("aiDisclaimer")}</span>
                  <button onClick={() => setAiAnalysis(null)} className="ml-auto text-t3 hover:text-t1"><X className="h-3.5 w-3.5" /></button>
                </div>
                <p className="text-sm text-t2 whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
              </div>
            )}

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <Select
                  label="Status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <option value="draft">Entwurf</option>
                  <option value="active">Aktiv</option>
                  <option value="archived">Archiviert</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Beschreibung"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
                <Select
                  label="Kategorie"
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                >
                  <option value="">Keine Kategorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-t2 uppercase tracking-wide mb-1.5">
                  Prompt-Inhalt
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={16}
                  className="input-glass font-mono text-sm resize-y min-h-[280px]"
                  placeholder="Sie sind ein hilfreicher KI-Assistent..."
                />
              </div>

              <Input
                label="Versions-Notiz (für neue Version)"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Was hat sich geändert?"
              />

              {/* API usage */}
              <div className="panel p-4">
                <p className="text-xs font-semibold text-t3 uppercase tracking-wider mb-2">REST API Endpunkt</p>
                <code className="text-xs text-indigo-500 break-all font-mono">
                  GET {process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/v1/prompts/{selectedPrompt.slug}
                </code>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-t4">
            <div
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{ background: "rgba(99,102,241,0.10)", boxShadow: "0 0 40px rgba(99,102,241,0.15)" }}
            >
              <FileText className="h-9 w-9 text-indigo-500" />
            </div>
            <p className="text-base font-semibold text-t2">Wählen Sie einen Prompt aus</p>
            <p className="text-sm text-t4 mt-1">oder erstellen Sie einen neuen Prompt</p>
          </div>
        )}
      </div>

      {/* Versions panel */}
      <Dialog open={showVersions} onClose={() => setShowVersions(false)} title="Versionen" className="max-w-lg">
        {versionsLoading ? (
          <p className="text-sm text-zinc-500">Laden...</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine Versionen.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center gap-3 panel-subtle p-3">
                <GitBranch className="h-4 w-4 text-indigo-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-t1">Version {v.version}</p>
                  {v.change_note && <p className="text-xs text-t3">{v.change_note}</p>}
                  <p className="text-xs text-t4">{formatDate(v.created_at)}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleRollback(v.id)}>
                  <RotateCcw className="h-3.5 w-3.5" /> Rollback
                </Button>
              </div>
            ))}
          </div>
        )}
      </Dialog>

      {/* Create prompt dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title="Neuer Prompt">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input id="new-name" name="name" label="Name" placeholder="Kunden-Service Prompt" required />
          <Input id="new-description" name="description" label="Beschreibung" placeholder="Optional" />
          <Select id="new-category" name="category_id" label="Kategorie">
            <option value="">Keine Kategorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>
          <Textarea id="new-content" name="content" label="Prompt-Inhalt" rows={6} placeholder="Sie sind ein hilfreicher KI-Assistent..." />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Abbrechen</Button>
            <Button type="submit" loading={isPending}>Erstellen</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Prompt löschen"
        description="Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        loading={isPending}
      />
    </div>
  );
}
