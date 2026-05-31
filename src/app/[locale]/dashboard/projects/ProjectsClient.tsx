"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { Plus, FolderOpen, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
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
    <div className="p-6 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t1">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-t3">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          {t("new")}
        </Button>
      </div>

      {/* Project grid */}
      {projects.length === 0 ? (
        <div className="panel-subtle flex flex-col items-center justify-center border-dashed py-24">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(99,102,241,0.12)", boxShadow: "0 0 30px rgba(99,102,241,0.20)" }}
          >
            <FolderOpen className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="font-semibold text-t2 mb-1">{t("empty")}</p>
          <p className="text-sm text-t3 mb-6">{t("emptyDescription")}</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> {t("create")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div key={project.id} className="group card-hover panel p-5">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: "rgba(99,102,241,0.12)", boxShadow: "0 0 16px rgba(99,102,241,0.20)" }}
                >
                  <FolderOpen className="h-5 w-5 text-indigo-400" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditProject(project)}
                    className="rounded-lg p-1.5 text-t3 hover:bg-black/5 dark:hover:bg-white/6 hover:text-t1 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(project.id)}
                    className="rounded-lg p-1.5 text-t3 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-t1 mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-sm text-t3 mb-4 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-t4 mb-3">
                <span>{project.prompt_count} Prompts</span>
                <span>{formatDate(project.updated_at)}</span>
              </div>

              <Link
                href={{ pathname: "/dashboard/projects/[id]", params: { id: project.id } }}
                className="flex items-center gap-1 text-sm font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                Prompts anzeigen <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onClose={() => setShowCreate(false)} title={t("create")}>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {error && <p className="text-sm text-rose-400">{error}</p>}
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
          {error && <p className="text-sm text-rose-400">{error}</p>}
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
