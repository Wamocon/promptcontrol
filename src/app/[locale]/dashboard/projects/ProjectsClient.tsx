"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { Plus, FolderOpen, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";
import { createProject, deleteProject, updateProject } from "./actions";
import { formatDate } from "@/lib/utils";
import type { Project } from "@/types";

interface ProjectsClientProps {
  projects: (Project & { prompt_count: number })[];
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const t = useTranslations("projects");
  const tc = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createProject(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowCreate(false);
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editProject) return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProject(editProject.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditProject(null);
      }
    });
  }

  function handleDelete() {
    if (!deleteId) return;
    startTransition(async () => {
      await deleteProject(deleteId);
      setDeleteId(null);
    });
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white py-20 dark:border-zinc-700 dark:bg-zinc-900">
          <FolderOpen className="h-12 w-12 text-zinc-300 dark:text-zinc-600 mb-3" />
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{t("empty")}</p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{t("emptyDescription")}</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> {t("create")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="group hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditProject(project)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(project.id)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
                <span>{project.prompt_count} Prompts</span>
                <span>{formatDate(project.updated_at)}</span>
              </div>

              <Link
                href={{ pathname: "/dashboard/projects/[id]", params: { id: project.id } }}
                className="mt-3 flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Prompts anzeigen <ChevronRight className="h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title={t("create")}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Input id="name" name="name" label={t("name")} placeholder="HR Prompts" required />
          <Textarea id="description" name="description" label={t("description")} placeholder="Beschreibung (optional)" rows={3} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>{tc("cancel")}</Button>
            <Button type="submit" loading={isPending}>{t("create")}</Button>
          </div>
        </form>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onClose={() => setEditProject(null)} title={t("edit")}>
        <form onSubmit={handleEdit} className="flex flex-col gap-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Input id="edit-name" name="name" label={t("name")} defaultValue={editProject?.name} required />
          <Textarea id="edit-description" name="description" label={t("description")} defaultValue={editProject?.description ?? ""} rows={3} />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setEditProject(null)}>{tc("cancel")}</Button>
            <Button type="submit" loading={isPending}>{tc("save")}</Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t("confirmDelete")}
        confirmLabel={tc("delete")}
        loading={isPending}
      />
    </div>
  );
}
