"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo, useRef, useEffect } from "react";
import {
  Plus,
  Wrench,
  Trash2,
  Search,
  Layers,
  Download,
  GitBranch,
  RotateCcw,
  Save,
  Upload,
  Paperclip,
  FileUp,
  Zap,
  Archive,
  FileEdit,
  Tag,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import {
  createSkill,
  updateSkill,
  deleteSkill,
  rollbackSkillVersion,
  createSkillCategory,
  uploadSkillFile,
  deleteSkillFile,
  importSkillMd,
  polishSkillWithAI,
} from "./actions";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Skill, SkillCategory, SkillFile, SkillVersion } from "@/types";

type SkillWithExtras = Skill & { category?: SkillCategory | null; files?: SkillFile[] };

interface SkillsClientProps {
  initialSkills: SkillWithExtras[];
  categories: SkillCategory[];
}

function StatusIcon({ status }: { status: string }) {
  if (status === "active") return <Zap className="h-3.5 w-3.5 text-emerald-500" />;
  if (status === "archived") return <Archive className="h-3.5 w-3.5 text-zinc-400" />;
  return <FileEdit className="h-3.5 w-3.5 text-amber-400" />;
}

export function SkillsClient({ initialSkills, categories: initialCategories }: SkillsClientProps) {
  const t = useTranslations("skills");
  const tc = useTranslations("common");
  const router = useRouter();

  const [skills, setSkills] = useState(initialSkills);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedSkill, setSelectedSkill] = useState<SkillWithExtras | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState("draft");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [changeNote, setChangeNote] = useState("");

  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<SkillVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [polishingId, setPolishingId] = useState<string | null>(null);
  const [bulkPolish, setBulkPolish] = useState<{ done: number; total: number; failed: number } | null>(null);
  const bulkPolishStopRef = useRef(false);

  // router.refresh() (nach Datei-Upload, Import, Rollback) liefert neue
  // Server-Props, aber useState() liest sie nur beim ersten Mount. Hier
  // bewusst mit den frischen Props synchronisieren.
  useEffect(() => {
    setSkills(initialSkills);
  }, [initialSkills]);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    if (!selectedSkill) return;
    const fresh = initialSkills.find((s) => s.id === selectedSkill.id);
    if (fresh) setSelectedSkill(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSkills]);

  const filteredSkills = useMemo(() => {
    let list = skills;
    if (categoryFilter !== "all") {
      list = list.filter((s) =>
        categoryFilter === "__none__" ? !s.category_id : s.category_id === categoryFilter
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description ?? "").toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
      );
    }
    return list;
  }, [skills, searchQuery, categoryFilter]);

  function openEditor(skill: SkillWithExtras) {
    setSelectedSkill(skill);
    setEditName(skill.name);
    setEditDescription(skill.description ?? "");
    setEditContent(skill.content);
    setEditStatus(skill.status);
    setEditCategoryId(skill.category_id ?? "");
    setChangeNote("");
    setShowVersions(false);
    setVersions([]);
    setError(null);
  }

  function closeEditor() {
    setSelectedSkill(null);
  }

  function refreshSkillInList(patch: Partial<SkillWithExtras>) {
    if (!selectedSkill) return;
    setSkills((prev) =>
      prev.map((s) => (s.id === selectedSkill.id ? { ...s, ...patch } : s))
    );
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createSkill(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowCreate(false);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    });
  }

  function handleSave(saveAsVersion: boolean) {
    if (!selectedSkill) return;
    const formData = new FormData();
    formData.set("name", editName);
    formData.set("content", editContent);
    formData.set("description", editDescription);
    formData.set("status", editStatus);
    formData.set("category_id", editCategoryId);
    formData.set("change_note", changeNote);
    startTransition(async () => {
      const result = await updateSkill(selectedSkill.id, formData, saveAsVersion);
      if (result.error) {
        setError(result.error);
      } else {
        setChangeNote("");
        const category = categories.find((c) => c.id === editCategoryId) ?? null;
        refreshSkillInList({
          name: editName,
          description: editDescription,
          status: editStatus as Skill["status"],
          category_id: editCategoryId || null,
          category,
          content: editContent,
          updated_at: new Date().toISOString(),
          current_version: saveAsVersion ? selectedSkill.current_version + 1 : selectedSkill.current_version,
        });
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      const result = await deleteSkill(deleteId);
      if (!result.error) {
        setSkills((prev) => prev.filter((s) => s.id !== deleteId));
        setDeleteId(null);
        closeEditor();
      } else {
        setError(result.error);
        setDeleteId(null);
      }
    });
  }

  function handleUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedSkill) return;
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      const result = await uploadSkillFile(selectedSkill.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDeleteFile(fileId: string) {
    startTransition(async () => {
      await deleteSkillFile(fileId);
      if (selectedSkill) {
        refreshSkillInList({
          files: (selectedSkill.files ?? []).filter((f) => f.id !== fileId),
        });
      }
    });
  }

  function handleImport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await importSkillMd(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowImport(false);
        router.refresh();
      }
    });
  }

  function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createSkillCategory(formData);
      if (result.category) {
        setCategories((prev) => [...prev, result.category as SkillCategory]);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  async function loadVersions() {
    if (!selectedSkill) return;
    setVersionsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("skill_versions")
      .select("*")
      .eq("skill_id", selectedSkill.id)
      .order("version", { ascending: false });
    setVersions((data as SkillVersion[]) ?? []);
    setVersionsLoading(false);
  }

  function handleShowVersions() {
    setShowVersions(true);
    loadVersions();
  }

  async function handlePolish(skillId: string) {
    setPolishingId(skillId);
    setError(null);
    const result = await polishSkillWithAI(skillId);
    setPolishingId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSkills((prev) =>
      prev.map((s) =>
        s.id === skillId
          ? { ...s, name: result.name!, description: result.description!, content: result.content!, current_version: s.current_version + 1 }
          : s
      )
    );
    if (selectedSkill?.id === skillId) {
      setEditName(result.name!);
      setEditDescription(result.description!);
      setEditContent(result.content!);
    }
  }

  async function handleBulkPolish() {
    bulkPolishStopRef.current = false;
    const targets = skills.map((s) => s.id);
    setBulkPolish({ done: 0, total: targets.length, failed: 0 });
    let failed = 0;
    for (let i = 0; i < targets.length; i++) {
      if (bulkPolishStopRef.current) break;
      const result = await polishSkillWithAI(targets[i]);
      if (result.error) failed++;
      setBulkPolish({ done: i + 1, total: targets.length, failed });
    }
    router.refresh();
  }

  function stopBulkPolish() {
    bulkPolishStopRef.current = true;
  }

  function handleRollback(versionId: string) {
    if (!selectedSkill) return;
    startTransition(async () => {
      await rollbackSkillVersion(selectedSkill.id, versionId);
      setShowVersions(false);
      window.location.reload();
    });
  }

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-t1">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-t3">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setShowCategories(true)}>
            <Tag className="h-4 w-4" /> {t("categories")}
          </Button>
          <Button variant="secondary" onClick={() => setShowImport(true)}>
            <FileUp className="h-4 w-4" /> {t("import")}
          </Button>
          <Button
            variant="secondary"
            onClick={handleBulkPolish}
            disabled={!!bulkPolish && bulkPolish.done < bulkPolish.total}
          >
            <Sparkles className="h-4 w-4" /> {t("polishAll")}
          </Button>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> {t("new")}
          </Button>
        </div>
      </div>

      {/* Bulk-Aufbereitung Fortschritt */}
      {bulkPolish && (
        <div className="mb-6 panel p-4 rounded-xl flex items-center gap-4">
          <Sparkles className="h-5 w-5 text-indigo-500 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-t2 font-medium">
                {bulkPolish.done < bulkPolish.total
                  ? t("polishProgress", { done: bulkPolish.done, total: bulkPolish.total })
                  : t("polishDone", { total: bulkPolish.total, failed: bulkPolish.failed })}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${(bulkPolish.done / Math.max(bulkPolish.total, 1)) * 100}%` }}
              />
            </div>
          </div>
          {bulkPolish.done < bulkPolish.total ? (
            <Button size="sm" variant="ghost" onClick={stopBulkPolish}>{tc("cancel")}</Button>
          ) : (
            <button onClick={() => setBulkPolish(null)} className="text-t4 hover:text-t1 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Search + category filter chips */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-t4 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="input-glass w-full pl-9 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              categoryFilter === "all"
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-500"
                : "border-[color:var(--panel-border)] text-t3 hover:text-t1"
            }`}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
              style={{
                background: categoryFilter === cat.id ? `${cat.color}20` : "transparent",
                borderColor: categoryFilter === cat.id ? `${cat.color}50` : "var(--panel-border)",
                color: categoryFilter === cat.id ? cat.color : "var(--text-3)",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

      {/* Skill grid */}
      {filteredSkills.length === 0 ? (
        <div className="panel-subtle flex flex-col items-center justify-center border-dashed py-24">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(99,102,241,0.12)", boxShadow: "0 0 30px rgba(99,102,241,0.20)" }}
          >
            <Wrench className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="font-semibold text-t2 mb-1">{searchQuery ? tc("noResults") : t("empty")}</p>
          {!searchQuery && <p className="text-sm text-t3 mb-6">{t("emptyDescription")}</p>}
          {!searchQuery && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> {t("create")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSkills.map((skill) => (
            <button
              key={skill.id}
              onClick={() => openEditor(skill)}
              className="group text-left card-hover panel p-5"
              style={{ borderLeft: skill.category ? `3px solid ${skill.category.color}` : undefined }}
            >
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "rgba(99,102,241,0.12)" }}
                  >
                    <Wrench className="h-4.5 w-4.5 text-indigo-400" />
                  </div>
                  <h3 className="font-semibold text-t1 truncate">{skill.name}</h3>
                </div>
                <StatusIcon status={skill.status} />
              </div>

              {skill.description && (
                <p className="text-sm text-t3 mb-3 line-clamp-2">{skill.description}</p>
              )}

              <div className="flex items-center gap-2 flex-wrap text-xs text-t4">
                {skill.category && (
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full font-medium"
                    style={{ background: `${skill.category.color}15`, color: skill.category.color }}
                  >
                    <Layers className="h-3 w-3" /> {skill.category.name}
                  </span>
                )}
                {skill.files && skill.files.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Paperclip className="h-3 w-3" /> {skill.files.length}
                  </span>
                )}
                <span className="ml-auto">{formatDate(skill.updated_at)}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ─── Editor dialog ─── */}
      <Dialog open={!!selectedSkill} onClose={closeEditor} title={editName} size="lg">
        {selectedSkill && (
          <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex-1" />
              <button
                onClick={() => handlePolish(selectedSkill.id)}
                disabled={polishingId === selectedSkill.id}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-indigo-500 hover:bg-indigo-400/8 disabled:opacity-50 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {polishingId === selectedSkill.id ? t("polishRunning") : t("polish")}
              </button>
              <a
                href={`/api/v1/skills/${selectedSkill.slug}/download`}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> {t("download")}
              </a>
              <button
                onClick={handleShowVersions}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-t2 hover:bg-black/5 dark:hover:bg-white/5 hover:text-t1 transition-colors"
              >
                <GitBranch className="h-3.5 w-3.5" /> {t("versions")}
              </button>
              <button
                onClick={() => setDeleteId(selectedSkill.id)}
                aria-label={t("deleteConfirmTitle")}
                className="rounded-lg p-1.5 text-t4 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <Button size="sm" variant="secondary" onClick={() => handleSave(false)} loading={isPending}>
                <Save className="h-3.5 w-3.5" /> {tc("save")}
              </Button>
              <Button size="sm" onClick={() => handleSave(true)} loading={isPending}>
                + {t("version")}
              </Button>
            </div>

            {error && <p className="text-sm text-rose-500">{error}</p>}

            {/* Fields */}
            <div className="grid grid-cols-2 gap-4">
              <Input label={t("name")} value={editName} onChange={(e) => setEditName(e.target.value)} />
              <Select label={t("status")} value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
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
              <Select label={t("category")} value={editCategoryId} onChange={(e) => setEditCategoryId(e.target.value)}>
                <option value="">{t("uncategorized")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                placeholder="# Anleitung...\n\nSchritt fuer Schritt..."
              />
            </div>

            <Input
              label={t("versionNote")}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder={t("versionNotePlaceholder")}
            />

            {/* Attachments */}
            <div className="panel p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-t3 uppercase tracking-wider">{t("files")}</p>
                <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> {t("upload")}
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleUploadFile} />
              </div>
              {selectedSkill.files && selectedSkill.files.length > 0 ? (
                <div className="flex flex-col gap-1.5">
                  {selectedSkill.files.map((f) => (
                    <div key={f.id} className="flex items-center gap-2 text-sm text-t2">
                      <Paperclip className="h-3.5 w-3.5 text-t4 shrink-0" />
                      <span className="font-mono truncate flex-1">{f.path}</span>
                      <button
                        onClick={() => handleDeleteFile(f.id)}
                        className="text-t4 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-t4">{t("noFiles")}</p>
              )}
            </div>

            <div className="panel p-4 rounded-xl">
              <p className="text-xs font-semibold text-t3 uppercase tracking-wider mb-1.5">{t("mcpTool")}</p>
              <code className="text-xs text-indigo-500 break-all font-mono">
                get_skill(&quot;{selectedSkill.slug}&quot;)
              </code>
            </div>
          </div>
        )}
      </Dialog>

      {/* Versions dialog */}
      <Dialog open={showVersions} onClose={() => setShowVersions(false)} title={t("versions")} className="max-w-lg">
        {versionsLoading ? (
          <p className="text-sm text-t4">{tc("loading")}</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-t4">{t("noVersions")}</p>
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

      {/* Create dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title={t("new")}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <Input id="new-name" name="name" label={t("name")} placeholder="Code-Review-Checkliste" required />
          <Input id="new-description" name="description" label={t("description")} placeholder={tc("or") + " " + tc("cancel")} />
          <Select id="new-category" name="category_id" label={t("category")}>
            <option value="">{t("uncategorized")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>
          <Textarea id="new-content" name="content" label={t("content")} rows={6} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>{tc("cancel")}</Button>
            <Button type="submit" loading={isPending}>{t("new")}</Button>
          </div>
        </form>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={showImport} onClose={() => setShowImport(false)} title={t("import")} description={t("importDescription")}>
        <form onSubmit={handleImport} className="flex flex-col gap-4">
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <input ref={importInputRef} type="file" name="file" accept=".md,.zip" required className="input-glass" />
          <Select id="import-category" name="category_id" label={t("category")}>
            <option value="">{t("uncategorized")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowImport(false)}>{tc("cancel")}</Button>
            <Button type="submit" loading={isPending}>{t("import")}</Button>
          </div>
        </form>
      </Dialog>

      {/* Categories dialog */}
      <Dialog open={showCategories} onClose={() => setShowCategories(false)} title={t("categories")}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2 text-sm text-t2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: cat.color }} />
                {cat.name}
              </div>
            ))}
            {categories.length === 0 && <p className="text-sm text-t4">{t("noCategories")}</p>}
          </div>
          <form onSubmit={handleCreateCategory} className="flex items-end gap-2 border-t pt-4" style={{ borderColor: "var(--panel-border)" }}>
            <Input id="cat-name" name="name" label={t("categoryName")} required className="flex-1" />
            <input type="color" name="color" defaultValue="#6366f1" className="h-10 w-12 rounded-lg border-0 cursor-pointer" />
            <Button type="submit" size="sm" loading={isPending}>{tc("save")}</Button>
          </form>
        </div>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("deleteConfirmTitle")}
        description={t("deleteConfirmDesc")}
        confirmLabel={tc("delete")}
        loading={isPending}
      />
    </div>
  );
}
