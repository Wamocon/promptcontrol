"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition, useMemo } from "react";
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
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  Zap,
  Archive,
  FileEdit,
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

type PromptWithCategory = Prompt & { prompt_categories?: PromptCategory | null };

/** Group prompts by category, uncategorized last */
function groupByCategory(
  prompts: PromptWithCategory[],
  categories: PromptCategory[]
): Array<{ category: PromptCategory | null; prompts: PromptWithCategory[] }> {
  const catMap = new Map<string | null, PromptWithCategory[]>();
  catMap.set(null, []);
  for (const cat of categories) catMap.set(cat.id, []);

  for (const p of prompts) {
    const key = p.category_id ?? null;
    if (!catMap.has(key)) catMap.set(key, []);
    catMap.get(key)!.push(p);
  }

  const catById = new Map(categories.map((c) => [c.id, c]));
  const result: Array<{ category: PromptCategory | null; prompts: PromptWithCategory[] }> = [];

  for (const cat of categories) {
    const ps = catMap.get(cat.id) ?? [];
    result.push({ category: catById.get(cat.id) ?? null, prompts: ps });
  }

  const uncategorized = catMap.get(null) ?? [];
  if (uncategorized.length > 0) {
    result.push({ category: null, prompts: uncategorized });
  }

  return result.filter((g) => g.prompts.length > 0);
}

function statusIcon(status: string) {
  if (status === "active") return <Zap className="h-3 w-3 text-emerald-500" />;
  if (status === "archived") return <Archive className="h-3 w-3 text-zinc-400" />;
  return <FileEdit className="h-3 w-3 text-amber-400" />;
}

function statusBadge(status: string) {
  if (status === "active") return <Badge variant="success">Aktiv</Badge>;
  if (status === "archived") return <Badge variant="default">Archiviert</Badge>;
  return <Badge variant="warning">Entwurf</Badge>;
}

export function PromptsClient({ project, initialPrompts, categories }: PromptsClientProps) {
  const t = useTranslations("prompts");

  const [prompts] = useState(initialPrompts);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithCategory | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  // AI analysis state
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Compliance state
  const [complianceResult, setComplianceResult] = useState<{ clean: boolean; issues: string[] } | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  // Versions panel
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Editor state
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<string>("draft");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [changeNote, setChangeNote] = useState("");

  // Filtered + grouped prompts
  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const q = searchQuery.toLowerCase();
    return prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [prompts, searchQuery]);

  const grouped = useMemo(
    () => groupByCategory(filteredPrompts, categories),
    [filteredPrompts, categories]
  );

  // Stats
  const activeCount = prompts.filter((p) => p.status === "active").length;
  const draftCount = prompts.filter((p) => p.status === "draft").length;

  function toggleCategory(id: string) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectPrompt(prompt: PromptWithCategory) {
    setSelectedPrompt(prompt);
    setEditContent(prompt.content);
    setEditName(prompt.name);
    setEditDescription(prompt.description ?? "");
    setEditStatus(prompt.status);
    setEditCategoryId(prompt.category_id ?? "");
    setAiAnalysis(null);
    setAiProvider(null);
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
      if (result.error) setError(result.error);
      else setChangeNote("");
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
    const header =
      type === "instruction"
        ? `---\napplyTo: "**/*"\n---\n# ${editName}\n\n`
        : `---\nname: ${editName.toLowerCase().replace(/\s+/g, "-")}\ndescription: "${editDescription || editName}"\n---\n# ${editName}\n\n`;
    const blob = new Blob([header + editContent], { type: "text/markdown" });
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
    const piiPatterns = [
      { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: "E-Mail" },
      { pattern: /\b\d{3,4}[-\s]?\d{6,7}\b/g, label: "Telefonnummer" },
      { pattern: /\b(?:IBAN|iban)[:\s]*[A-Z]{2}\d{2}[A-Z0-9]{1,30}\b/g, label: "IBAN" },
      { pattern: /\b\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}\b/g, label: "Kreditkartennummer" },
      { pattern: /\bpassword\s*[:=]\s*\S+/gi, label: "Passwort im Klartext" },
      { pattern: /\bapi[_\s-]?key\s*[:=]\s*\S+/gi, label: "API-SchlÃ¼ssel" },
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
    setAiProvider(null);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: editContent, name: editName }),
      });
      const data = await response.json();
      setAiAnalysis(data.analysis ?? "Analyse nicht verfÃ¼gbar.");
      if (data.provider) setAiProvider(`${data.provider}${data.model ? ` / ${data.model}` : ""}`);
    } catch {
      setAiAnalysis("Fehler bei der KI-Analyse.");
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

  return (
    <div className="flex h-full overflow-hidden">
      {/* â”€â”€â”€ Left panel: structured prompt library â”€â”€â”€ */}
      <div
        className="w-80 shrink-0 border-r flex flex-col"
        style={{ background: "var(--panel-bg)", borderColor: "var(--panel-border)", backdropFilter: "blur(16px)" }}
      >
        {/* Project header */}
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--panel-border)" }}>
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1 text-xs text-t3 hover:text-t1 mb-1.5 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" /> Alle Projekte
          </Link>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-t1 truncate">{project.name}</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-t4">{prompts.length} Prompts</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 border-b divide-x" style={{ borderColor: "var(--panel-border)" }}>
          <div className="flex flex-col items-center py-2">
            <span className="text-sm font-bold text-t1">{prompts.length}</span>
            <span className="text-[10px] text-t4 uppercase tracking-wide">Gesamt</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <span className="text-sm font-bold text-emerald-500">{activeCount}</span>
            <span className="text-[10px] text-t4 uppercase tracking-wide">Aktiv</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <span className="text-sm font-bold text-amber-400">{draftCount}</span>
            <span className="text-[10px] text-t4 uppercase tracking-wide">Entwurf</span>
          </div>
        </div>

        {/* Search + New */}
        <div className="px-3 py-2.5 border-b space-y-2" style={{ borderColor: "var(--panel-border)" }}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-t4 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Prompts suchen..."
              className="input-glass w-full pl-8 text-xs py-1.5"
            />
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="w-full">
            <Plus className="h-3.5 w-3.5" /> Neuer Prompt
          </Button>
        </div>

        {/* Grouped prompt list */}
        <div className="flex-1 overflow-y-auto">
          {grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-t4 text-sm gap-2">
              <FileText className="h-8 w-8" />
              {searchQuery ? "Keine Ergebnisse" : "Noch keine Prompts"}
            </div>
          ) : (
            grouped.map(({ category, prompts: groupPrompts }) => {
              const catId = category?.id ?? "__none__";
              const isCollapsed = collapsedCategories.has(catId);
              const catColor = category?.color ?? "#71717a";

              return (
                <div key={catId}>
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(catId)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-black/3 dark:hover:bg-white/3 transition-colors sticky top-0 z-10"
                    style={{ background: "var(--panel-bg-subtle)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--panel-border)" }}
                  >
                    <span
                      className="flex h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: catColor, boxShadow: `0 0 6px ${catColor}60` }}
                    />
                    <span className="flex-1 text-xs font-semibold text-t2 uppercase tracking-wider">
                      {category?.name ?? "Ohne Kategorie"}
                    </span>
                    <span className="text-[10px] text-t4 font-medium tabular-nums px-1.5 py-0.5 rounded-full" style={{ background: `${catColor}20`, color: catColor }}>
                      {groupPrompts.length}
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-t4 shrink-0" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-t4 shrink-0" />
                    )}
                  </button>

                  {/* Prompt cards */}
                  {!isCollapsed && groupPrompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => selectPrompt(prompt)}
                      className={`w-full text-left px-3 py-2.5 border-b transition-all ${
                        selectedPrompt?.id === prompt.id
                          ? "bg-indigo-500/10"
                          : "hover:bg-black/3 dark:hover:bg-white/3"
                      }`}
                      style={{
                        borderBottomColor: "var(--panel-border)",
                        borderLeft: `3px solid ${selectedPrompt?.id === prompt.id ? catColor : "transparent"}`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <span className="text-sm font-medium text-t1 truncate leading-snug">{prompt.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {statusIcon(prompt.status)}
                        </div>
                      </div>
                      {prompt.description && (
                        <p className="text-xs text-t4 truncate mb-1 leading-snug">{prompt.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-t4 tabular-nums">v{prompt.current_version}</span>
                        <span className="text-t5">Â·</span>
                        <span className="text-[10px] text-t4">{formatDate(prompt.updated_at)}</span>
                        <span className="ml-auto text-[10px] font-mono text-t5 truncate max-w-20">{prompt.slug}</span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* â”€â”€â”€ Right panel: editor â”€â”€â”€ */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
        {selectedPrompt ? (
          <>
            {/* Toolbar */}
            <div
              className="flex items-center gap-1.5 border-b px-4 py-2.5 flex-wrap"
              style={{ background: "var(--panel-bg-subtle)", borderColor: "var(--panel-border)", backdropFilter: "blur(16px)" }}
            >
              {/* Category indicator */}
              {selectedPrompt.prompt_categories && (
                <span
                  className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium shrink-0"
                  style={{
                    background: `${selectedPrompt.prompt_categories.color}15`,
                    color: selectedPrompt.prompt_categories.color,
                  }}
                >
                  <Layers className="h-3 w-3" />
                  {selectedPrompt.prompt_categories.name}
                </span>
              )}

              <span className="flex-1 text-sm font-semibold text-t1 truncate">{editName}</span>

              <button onClick={handleCopy} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/6 hover:text-t1 transition-colors">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Kopiert" : "Kopieren"}
              </button>

              <button onClick={handleComplianceCheck} disabled={complianceLoading} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-amber-500 hover:bg-amber-400/8 hover:text-amber-600 transition-colors">
                <Shield className="h-3.5 w-3.5" />
                {complianceLoading ? "PrÃ¼fe..." : "Compliance"}
              </button>

              <button onClick={handleAiAnalysis} disabled={aiLoading} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-indigo-500 hover:bg-indigo-400/8 hover:text-indigo-600 transition-colors">
                <Brain className="h-3.5 w-3.5" />
                {aiLoading ? "Analysiert..." : "KI-Analyse"}
              </button>

              <button onClick={handleShowVersions} className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/6 hover:text-t1 transition-colors">
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

              <button onClick={() => setDeleteId(selectedPrompt.id)} aria-label="Prompt löschen" className="rounded-lg p-1.5 text-t4 hover:bg-rose-500/10 hover:text-rose-500 transition-colors">
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
              <div className={`mx-4 mt-3 rounded-xl px-4 py-3 text-sm flex items-start gap-2 border ${complianceResult.clean ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-500" : "border-rose-500/25 bg-rose-500/8 text-rose-500"}`}>
                {complianceResult.clean ? (
                  <><Check className="h-4 w-4 mt-0.5 shrink-0" /> {t("complianceClean")}</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" /> {t("complianceIssues")}: {complianceResult.issues.join(", ")}</>
                )}
                <button onClick={() => setComplianceResult(null)} aria-label="Schließen" className="ml-auto opacity-50 hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
              </div>
            )}

            {/* AI analysis result */}
            {aiAnalysis && (
              <div className="mx-4 mt-3 rounded-xl border border-indigo-500/20 p-4" style={{ background: "rgba(99,102,241,0.07)" }}>
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-indigo-500">{t("aiDisclaimer")}</span>
                  {aiProvider && (
                    <span className="ml-1 text-[10px] text-t4 border border-indigo-500/20 rounded px-1.5 py-0.5">{aiProvider}</span>
                  )}
                  <button onClick={() => setAiAnalysis(null)} aria-label="Schließen" className="ml-auto text-t3 hover:text-t1"><X className="h-3.5 w-3.5" /></button>
                </div>
                <p className="text-sm text-t2 whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
              </div>
            )}

            {/* Editor */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Select label="Status" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="draft">Entwurf</option>
                  <option value="active">Aktiv</option>
                  <option value="archived">Archiviert</option>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Beschreibung" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
                <Select label="Kategorie" value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
                  <option value="">Keine Kategorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-t2 uppercase tracking-wide mb-1.5">Prompt-Inhalt</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={16}
                  className="input-glass font-mono text-sm resize-y min-h-70"
                  placeholder="Sie sind ein hilfreicher KI-Assistent..."
                />
              </div>

              <Input
                label="Versions-Notiz (fÃ¼r neue Version)"
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Was hat sich geÃ¤ndert?"
              />

              {/* API endpoint */}
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
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ background: "rgba(99,102,241,0.10)", boxShadow: "0 0 40px rgba(99,102,241,0.15)" }}>
              <FileText className="h-9 w-9 text-indigo-500" />
            </div>
            <p className="text-base font-semibold text-t2">Prompt auswÃ¤hlen</p>
            <p className="text-sm text-t4 mt-1">oder neuen Prompt erstellen</p>
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs w-full text-left">
              {categories.slice(0, 4).map((cat) => (
                <div key={cat.id} className="panel p-3 rounded-xl flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: cat.color }} />
                  <span className="text-xs text-t3 truncate">{cat.name}</span>
                  <span className="ml-auto text-xs text-t4">{prompts.filter((p) => p.category_id === cat.id).length}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Versions dialog */}
      <Dialog open={showVersions} onClose={() => setShowVersions(false)} title="Versionen" className="max-w-lg">
        {versionsLoading ? (
          <p className="text-sm text-zinc-500">Laden...</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine Versionen gespeichert.</p>
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
        title="Prompt lÃ¶schen"
        description="Diese Aktion kann nicht rÃ¼ckgÃ¤ngig gemacht werden."
        confirmLabel="LÃ¶schen"
        loading={isPending}
      />
    </div>
  );
}

