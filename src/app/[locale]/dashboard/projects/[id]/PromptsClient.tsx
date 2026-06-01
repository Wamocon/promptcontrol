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
  Languages,
  Pencil,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
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
    result.push({ category: catById.get(cat.id) ?? null, prompts: catMap.get(cat.id) ?? [] });
  }
  const uncategorized = catMap.get(null) ?? [];
  if (uncategorized.length > 0) result.push({ category: null, prompts: uncategorized });
  return result.filter((g) => g.prompts.length > 0);
}

function StatusIcon({ status }: { status: string }) {
  if (status === "active") return <Zap className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "archived") return <Archive className="h-3.5 w-3.5 text-zinc-400" />;
  return <FileEdit className="h-3.5 w-3.5 text-amber-400" />;
}

export function PromptsClient({ project, initialPrompts, categories }: PromptsClientProps) {
  const t = useTranslations("prompts");

  const [prompts, setPrompts] = useState(initialPrompts);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptWithCategory | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [complianceResult, setComplianceResult] = useState<{ clean: boolean; issues: string[] } | null>(null);
  const [complianceLoading, setComplianceLoading] = useState(false);

  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const [translating, setTranslating] = useState(false);
  const [translationMsg, setTranslationMsg] = useState<string | null>(null);

  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<string>("draft");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const [changeNote, setChangeNote] = useState("");

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

  function openEditor(prompt: PromptWithCategory) {
    setSelectedPrompt(prompt);
    setEditContent(prompt.content);
    setEditName(prompt.name);
    setEditDescription(prompt.description ?? "");
    setEditStatus(prompt.status);
    setEditCategoryId(prompt.category_id ?? "");
    setAiAnalysis(null);
    setAiProvider(null);
    setComplianceResult(null);
    setTranslationMsg(null);
    setShowVersions(false);
    setVersions([]);
    setError(null);
  }

  function closeEditor() {
    setSelectedPrompt(null);
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
        setPrompts((prev) =>
          prev.map((p) =>
            p.id === selectedPrompt.id
              ? {
                  ...p,
                  name: editName,
                  description: editDescription,
                  status: editStatus as Prompt["status"],
                  category_id: editCategoryId || null,
                  content: editContent,
                  updated_at: new Date().toISOString(),
                  current_version: saveAsVersion ? p.current_version + 1 : p.current_version,
                }
              : p
          )
        );
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deletePrompt(deleteId, project.id);
      setPrompts((prev) => prev.filter((p) => p.id !== deleteId));
      setDeleteId(null);
      closeEditor();
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
    a.download =
      type === "instruction"
        ? `${selectedPrompt.slug}.instructions.md`
        : `${selectedPrompt.slug}.skill.md`;
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
      { pattern: /\bapi[_\s-]?key\s*[:=]\s*\S+/gi, label: "API-Schlüssel" },
    ];
    const issues: string[] = [];
    piiPatterns.forEach(({ pattern, label }) => {
      if (pattern.test(editContent)) issues.push(label);
    });
    await new Promise((r) => setTimeout(r, 600));
    setComplianceResult({ clean: issues.length === 0, issues });
    setComplianceLoading(false);
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
      setAiAnalysis(data.analysis ?? "Analyse nicht verfügbar.");
      if (data.provider) setAiProvider(`${data.provider}${data.model ? ` / ${data.model}` : ""}`);
    } catch {
      setAiAnalysis("Fehler bei der KI-Analyse.");
    }
    setAiLoading(false);
  }

  async function handleTranslate(targetLang: "de" | "en") {
    if (!editContent) return;
    setTranslating(true);
    setTranslationMsg(null);
    try {
      const response = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent, targetLang }),
      });
      const data = await response.json();
      if (data.error) {
        setTranslationMsg(t("translationError") + ": " + data.error);
      } else {
        setEditContent(data.translatedContent);
        setTranslationMsg(t("translationDone"));
        setTimeout(() => setTranslationMsg(null), 3000);
      }
    } catch {
      setTranslationMsg(t("translationError"));
    }
    setTranslating(false);
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

  // Detect likely source language to show correct translate target
  const targetLang: "de" | "en" = useMemo(() => {
    const dePattern = /\b(Sie|das|die|der|ist|und|mit|haben|werden|wenn|bitte)\b/i;
    return dePattern.test(editContent) ? "en" : "de";
  }, [editContent]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Page header */}
      <div
        className="border-b px-6 py-4 flex items-center gap-4 shrink-0"
        style={{ background: "var(--panel-bg-subtle)", borderColor: "var(--panel-border)" }}
      >
        <div className="flex-1 min-w-0">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-1 text-xs text-t3 hover:text-t1 mb-1 transition-colors w-fit"
          >
            <ChevronLeft className="h-3 w-3" /> {t("allProjects")}
          </Link>
          <h1 className="text-lg font-bold text-t1 truncate">{project.name}</h1>
          {project.description && (
            <p className="text-xs text-t4 truncate mt-0.5">{project.description}</p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-4 text-center">
          <div>
            <p className="text-sm font-bold text-t1">{prompts.length}</p>
            <p className="text-[10px] text-t4 uppercase tracking-wide">{t("total")}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-500">{activeCount}</p>
            <p className="text-[10px] text-t4 uppercase tracking-wide">{t("active")}</p>
          </div>
          <div>
            <p className="text-sm font-bold text-amber-400">{draftCount}</p>
            <p className="text-[10px] text-t4 uppercase tracking-wide">{t("draft")}</p>
          </div>
        </div>

        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> {t("new")}
        </Button>
      </div>

      {/* Search bar */}
      <div
        className="border-b px-6 py-3 shrink-0"
        style={{ borderColor: "var(--panel-border)" }}
      >
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-t4 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Prompts suchen..."
            className="input-glass w-full pl-9 py-2 text-sm"
          />
        </div>
      </div>

      {/* Prompt list grouped by category */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-t4">
            <FileText className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-base font-semibold text-t2">
              {searchQuery ? t("noResults") : t("noPrompts")}
            </p>
            {!searchQuery && <p className="text-sm mt-1">{t("emptyDescription")}</p>}
          </div>
        ) : (
          grouped.map(({ category, prompts: groupPrompts }) => {
            const catId = category?.id ?? "__none__";
            const isCollapsed = collapsedCategories.has(catId);
            const catColor = category?.color ?? "#71717a";

            return (
              <section key={catId}>
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(catId)}
                  className="w-full flex items-center gap-2.5 mb-4 group"
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ background: catColor, boxShadow: `0 0 8px ${catColor}60` }}
                  />
                  <span className="text-sm font-bold text-t2 uppercase tracking-wider group-hover:text-t1 transition-colors">
                    {category?.name ?? t("uncategorized")}
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${catColor}20`, color: catColor }}
                  >
                    {groupPrompts.length}
                  </span>
                  <div className="flex-1 h-px" style={{ background: `${catColor}20` }} />
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 text-t4 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-t4 shrink-0" />
                  )}
                </button>

                {/* Prompt cards */}
                {!isCollapsed && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {groupPrompts.map((prompt) => (
                      <button
                        key={prompt.id}
                        onClick={() => openEditor(prompt)}
                        className="panel text-left p-4 rounded-xl flex flex-col gap-2.5 hover:shadow-lg transition-all group cursor-pointer"
                        style={{ borderLeft: `3px solid ${catColor}` }}
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-t1 leading-snug line-clamp-2 flex-1">
                            {prompt.name}
                          </span>
                          <StatusIcon status={prompt.status} />
                        </div>

                        {/* Description */}
                        {prompt.description && (
                          <p className="text-xs text-t3 line-clamp-2 leading-relaxed">
                            {prompt.description}
                          </p>
                        )}

                        {/* Content preview */}
                        <p className="text-xs text-t4 font-mono line-clamp-2 leading-relaxed bg-black/3 dark:bg-white/3 rounded px-2 py-1.5">
                          {prompt.content.slice(0, 140)}
                          {prompt.content.length > 140 ? "..." : ""}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center gap-2 mt-auto pt-1 border-t" style={{ borderColor: "var(--panel-border)" }}>
                          <span className="text-[10px] text-t5 font-mono truncate max-w-28">
                            {prompt.slug}
                          </span>
                          <span className="text-t5">·</span>
                          <span className="text-[10px] text-t4">v{prompt.current_version}</span>
                          <span className="text-t5">·</span>
                          <span className="text-[10px] text-t4">{formatDate(prompt.updated_at)}</span>
                          <span className="ml-auto flex items-center gap-1 text-[10px] text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil className="h-3 w-3" /> {t("openEditor")}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>

      {/* ─── Editor popup dialog ─── */}
      <Dialog
        open={!!selectedPrompt}
        onClose={closeEditor}
        title={editName}
        size="lg"
      >
        {selectedPrompt && (
          <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedPrompt.prompt_categories && (
                <span
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                  style={{
                    background: `${selectedPrompt.prompt_categories.color}15`,
                    color: selectedPrompt.prompt_categories.color,
                  }}
                >
                  <Layers className="h-3 w-3" />
                  {selectedPrompt.prompt_categories.name}
                </span>
              )}

              <div className="flex-1" />

              {/* DE <> EN translation toggle */}
              <button
                onClick={() => handleTranslate(targetLang)}
                disabled={translating || !editContent}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-violet-500 hover:bg-violet-500/8 disabled:opacity-50 transition-colors"
                title={targetLang === "de" ? t("translateToDe") : t("translateToEn")}
              >
                <Languages className="h-3.5 w-3.5" />
                {translating
                  ? t("translating")
                  : targetLang === "de"
                  ? t("translateToDe")
                  : t("translateToEn")}
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? t("copied") : t("copy")}
              </button>

              <button
                onClick={handleComplianceCheck}
                disabled={complianceLoading}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-amber-500 hover:bg-amber-400/8 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" />
                {complianceLoading ? t("complianceRunning") : t("compliance")}
              </button>

              <button
                onClick={handleAiAnalysis}
                disabled={aiLoading}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-indigo-500 hover:bg-indigo-400/8 transition-colors"
              >
                <Brain className="h-3.5 w-3.5" />
                {aiLoading ? t("aiAnalysisRunning") : t("aiAnalysis")}
              </button>

              <button
                onClick={handleShowVersions}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors"
              >
                <GitBranch className="h-3.5 w-3.5" /> {t("versions")}
              </button>

              <div className="relative group">
                <button className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors">
                  <Download className="h-3.5 w-3.5" /> {t("export")}
                </button>
                <div className="absolute right-0 top-9 z-20 hidden group-hover:block w-52 panel p-1 shadow-2xl">
                  <button
                    onClick={() => handleExport("instruction")}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm text-t2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors"
                  >
                    {t("exportInstruction")}
                  </button>
                  <button
                    onClick={() => handleExport("skill")}
                    className="w-full text-left rounded-lg px-3 py-2 text-sm text-t2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors"
                  >
                    {t("exportSkill")}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setDeleteId(selectedPrompt.id)}
                aria-label={t("deleteConfirmTitle")}
                className="rounded-lg p-1.5 text-t4 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleSave(false)}
                loading={isPending}
              >
                <Save className="h-3.5 w-3.5" /> {t("save")}
              </Button>
              <Button size="sm" onClick={() => handleSave(true)} loading={isPending}>
                + {t("version")}
              </Button>
            </div>

            {/* Translation message */}
            {translationMsg && (
              <div className="rounded-xl px-4 py-2.5 text-sm flex items-center gap-2 border border-violet-500/25 bg-violet-500/8 text-violet-500">
                <Languages className="h-4 w-4 shrink-0" />
                {translationMsg}
                <button
                  onClick={() => setTranslationMsg(null)}
                  aria-label="Schliessen"
                  className="ml-auto opacity-60 hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Compliance result */}
            {complianceResult && (
              <div
                className={`rounded-xl px-4 py-2.5 text-sm flex items-start gap-2 border ${
                  complianceResult.clean
                    ? "border-emerald-500/25 bg-emerald-500/8 text-emerald-500"
                    : "border-rose-500/25 bg-rose-500/8 text-rose-500"
                }`}
              >
                {complianceResult.clean ? (
                  <>
                    <Check className="h-4 w-4 mt-0.5 shrink-0" /> {t("complianceClean")}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    {t("complianceIssues")}: {complianceResult.issues.join(", ")}
                  </>
                )}
                <button
                  onClick={() => setComplianceResult(null)}
                  aria-label="Schliessen"
                  className="ml-auto opacity-50 hover:opacity-100"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* AI analysis result */}
            {aiAnalysis && (
              <div
                className="rounded-xl border border-indigo-500/20 p-4"
                style={{ background: "rgba(99,102,241,0.07)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-semibold text-indigo-500">{t("aiDisclaimer")}</span>
                  {aiProvider && (
                    <span className="ml-1 text-[10px] text-t4 border border-indigo-500/20 rounded px-1.5 py-0.5">
                      {aiProvider}
                    </span>
                  )}
                  <button
                    onClick={() => setAiAnalysis(null)}
                    aria-label="Schliessen"
                    className="ml-auto text-t3 hover:text-t1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-sm text-t2 whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
              </div>
            )}

            {error && <p className="text-sm text-rose-500">{error}</p>}

            {/* Editor fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("name")}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <Select
                label={t("status")}
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <option value="draft">{t("draft")}</option>
                <option value="active">{t("active")}</option>
                <option value="archived">{t("archived")}</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t("description")}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
              <Select
                label={t("category")}
                value={editCategoryId}
                onChange={(e) => setEditCategoryId(e.target.value)}
              >
                <option value="">{t("uncategorized")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-medium text-t2 uppercase tracking-wide mb-1.5">
                {t("content")}
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={14}
                className="input-glass font-mono text-sm resize-y min-h-64 w-full"
                placeholder="Sie sind ein hilfreicher KI-Assistent..."
              />
            </div>

            <Input
              label={t("versionNote")}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder={t("versionNotePlaceholder")}
            />

            <div className="panel p-4 rounded-xl">
              <p className="text-xs font-semibold text-t3 uppercase tracking-wider mb-1.5">
                {t("restApi")}
              </p>
              <code className="text-xs text-indigo-500 break-all font-mono">
                {"GET "}
                {process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}
                {"/api/v1/prompts/"}
                {selectedPrompt.slug}
              </code>
            </div>
          </div>
        )}
      </Dialog>

      {/* Versions dialog */}
      <Dialog
        open={showVersions}
        onClose={() => setShowVersions(false)}
        title={t("versions")}
        className="max-w-lg"
      >
        {versionsLoading ? (
          <p className="text-sm text-t4">Laden...</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-t4">Noch keine Versionen gespeichert.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center gap-3 panel p-3 rounded-xl">
                <GitBranch className="h-4 w-4 text-indigo-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-t1">Version {v.version}</p>
                  {v.change_note && <p className="text-xs text-t3">{v.change_note}</p>}
                  <p className="text-xs text-t4">{formatDate(v.created_at)}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => handleRollback(v.id)}>
                  <RotateCcw className="h-3.5 w-3.5" /> {t("rollback")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Dialog>

      {/* Create prompt dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title={t("new")}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input
            id="new-name"
            name="name"
            label={t("name")}
            placeholder="Kunden-Service Prompt"
            required
          />
          <Input
            id="new-description"
            name="description"
            label={t("description")}
            placeholder="Optional"
          />
          <Select id="new-category" name="category_id" label={t("category")}>
            <option value="">{t("uncategorized")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <Textarea
            id="new-content"
            name="content"
            label={t("content")}
            rows={6}
            placeholder="Sie sind ein hilfreicher KI-Assistent..."
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>
              Abbrechen
            </Button>
            <Button type="submit" loading={isPending}>
              {t("new")}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        confirmLabel={t("deleteConfirmTitle")}
        loading={isPending}
      />
    </div>
  );
}

