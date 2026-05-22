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
      <div className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col">
        {/* Project header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-2"
          >
            <ChevronLeft className="h-3 w-3" /> Alle Projekte
          </Link>
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{project.name}</h2>
        </div>

        {/* Category filter */}
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          >
            <option value="all">Alle Kategorien</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Add button */}
        <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
          <Button size="sm" onClick={() => setShowCreate(true)} className="w-full">
            <Plus className="h-3.5 w-3.5" /> Neuer Prompt
          </Button>
        </div>

        {/* Prompt list */}
        <div className="flex-1 overflow-y-auto">
          {filteredPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-400 dark:text-zinc-600 text-sm">
              <FileText className="h-8 w-8 mb-2" />
              Noch keine Prompts
            </div>
          ) : (
            filteredPrompts.map((prompt) => (
              <button
                key={prompt.id}
                onClick={() => selectPrompt(prompt)}
                className={`w-full text-left px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors ${selectedPrompt?.id === prompt.id ? "bg-indigo-50 dark:bg-indigo-900/20 border-l-2 border-l-indigo-600" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{prompt.name}</span>
                  {statusBadge(prompt.status)}
                </div>
                {prompt.prompt_categories && (
                  <span className="text-xs text-zinc-400" style={{ color: prompt.prompt_categories.color }}>
                    {prompt.prompt_categories.name}
                  </span>
                )}
                <p className="text-xs text-zinc-400 mt-1">{formatDate(prompt.updated_at)}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel: editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPrompt ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-2">
              <span className="flex-1 text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{editName}</span>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Kopiert" : "Kopieren"}
              </button>

              <button
                onClick={handleComplianceCheck}
                disabled={complianceLoading}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Shield className="h-3.5 w-3.5" />
                {complianceLoading ? "Prüfe..." : "Compliance"}
              </button>

              <button
                onClick={handleAiAnalysis}
                disabled={aiLoading}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Brain className="h-3.5 w-3.5" />
                {aiLoading ? "Analysiert..." : "KI-Analyse"}
              </button>

              <button
                onClick={handleShowVersions}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <GitBranch className="h-3.5 w-3.5" /> Versionen
              </button>

              <div className="relative group">
                <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  <Download className="h-3.5 w-3.5" /> Export
                </button>
                <div className="absolute right-0 top-8 z-10 hidden group-hover:block w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  <button onClick={() => handleExport("instruction")} className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">Als instruction.md</button>
                  <button onClick={() => handleExport("skill")} className="w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">Als skill.md</button>
                </div>
              </div>

              <button
                onClick={() => setDeleteId(selectedPrompt.id)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
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
              <div className={`mx-4 mt-3 rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${complianceResult.clean ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
                {complianceResult.clean ? (
                  <><Check className="h-4 w-4 mt-0.5 shrink-0" /> {t("complianceClean")}</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {t("complianceIssues")}: {complianceResult.issues.join(", ")}</>
                )}
                <button onClick={() => setComplianceResult(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            {/* AI analysis result */}
            {aiAnalysis && (
              <div className="mx-4 mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-800 dark:bg-indigo-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{t("aiDisclaimer")}</span>
                  <button onClick={() => setAiAnalysis(null)} className="ml-auto text-indigo-400"><X className="h-3.5 w-3.5" /></button>
                </div>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 whitespace-pre-wrap">{aiAnalysis}</p>
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
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Prompt-Inhalt
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={16}
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-mono text-zinc-900 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">REST API Endpunkt</p>
                <code className="text-xs text-indigo-600 dark:text-indigo-400 break-all">
                  GET {process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/v1/prompts/{selectedPrompt.slug}
                </code>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600">
            <FileText className="h-16 w-16 mb-4" />
            <p className="text-lg font-medium">Wählen Sie einen Prompt aus</p>
            <p className="text-sm">oder erstellen Sie einen neuen Prompt</p>
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
              <div key={v.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 p-3">
                <GitBranch className="h-4 w-4 text-indigo-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Version {v.version}</p>
                  {v.change_note && <p className="text-xs text-zinc-500">{v.change_note}</p>}
                  <p className="text-xs text-zinc-400">{formatDate(v.created_at)}</p>
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
