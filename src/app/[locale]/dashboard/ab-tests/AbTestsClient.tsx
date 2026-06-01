"use client";

import { useState, useTransition } from "react";
import { FlaskConical, Plus, Trash2, ToggleLeft, ToggleRight, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createAbTest, toggleAbTest, deleteAbTest } from "./actions";
import type { AbTest, Project, Prompt } from "@/types";

type AbTestWithPrompts = AbTest & {
  prompt_a?: Pick<Prompt, "id" | "name" | "slug"> | null;
  prompt_b?: Pick<Prompt, "id" | "name" | "slug"> | null;
};

interface AbTestsClientProps {
  abTests: AbTestWithPrompts[];
  projects: Pick<Project, "id" | "name">[];
  prompts: Pick<Prompt, "id" | "name" | "slug" | "project_id">[];
}

export function AbTestsClient({ abTests, projects, prompts }: AbTestsClientProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [weightA, setWeightA] = useState(50);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [localTests, setLocalTests] = useState(abTests);

  const filteredPrompts = prompts.filter(
    (p) => !selectedProject || p.project_id === selectedProject
  );

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("weight_a", String(weightA));
    startTransition(async () => {
      const result = await createAbTest(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowCreate(false);
        setError(null);
        setWeightA(50);
        setSelectedProject("");
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleAbTest(id, !current);
      setLocalTests((prev) =>
        prev.map((t) => (t.id === id ? { ...t, active: !current } : t))
      );
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteAbTest(id);
      setLocalTests((prev) => prev.filter((t) => t.id !== id));
    });
  }

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-t1 flex items-center gap-2.5">
            <FlaskConical className="h-6 w-6 text-purple-500" />
            A/B Tests
          </h1>
          <p className="mt-1.5 text-sm text-t3">
            Teste zwei Prompt-Varianten gegeneinander und optimiere deine KI-Performance.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Test
        </Button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative z-10 w-full max-w-lg panel p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-t1">Neuer A/B Test</h2>
              <button onClick={() => setShowCreate(false)} className="text-t3 hover:text-t1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-t2 mb-1.5">Testname</label>
                <input
                  name="name"
                  required
                  className="input-glass w-full"
                  placeholder="z. B. Support-Prompt Optimierung"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-t2 mb-1.5">Projekt</label>
                <select
                  name="project_id"
                  required
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="input-glass w-full"
                >
                  <option value="">Projekt wählen...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-t2 mb-1.5">Prompt A</label>
                  <select name="prompt_a_id" required className="input-glass w-full">
                    <option value="">Prompt A wählen...</option>
                    {filteredPrompts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-t2 mb-1.5">Prompt B</label>
                  <select name="prompt_b_id" required className="input-glass w-full">
                    <option value="">Prompt B wählen...</option>
                    {filteredPrompts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Weight slider */}
              <div>
                <div className="flex justify-between text-xs font-medium text-t2 mb-2">
                  <span>Gewichtung</span>
                  <span>A: {weightA}% &middot; B: {100 - weightA}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  step={5}
                  value={weightA}
                  onChange={(e) => setWeightA(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${weightA * 0.8}px`, minWidth: "8px", maxWidth: "72px" }} />
                    <span className="text-xs text-indigo-500 font-semibold">A</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-purple-500 font-semibold">B</span>
                    <div className="h-2 rounded-full bg-purple-500" style={{ width: `${(100 - weightA) * 0.8}px`, minWidth: "8px", maxWidth: "72px" }} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" className="flex-1" loading={isPending}>
                  Test erstellen
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tests list */}
      {localTests.length === 0 ? (
        <div className="panel-subtle flex flex-col items-center justify-center py-20 text-center">
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(168,85,247,0.12)", boxShadow: "0 0 30px rgba(168,85,247,0.22)" }}
          >
            <FlaskConical className="h-7 w-7 text-purple-500" />
          </div>
          <p className="font-semibold text-t2 mb-1">Noch keine A/B Tests</p>
          <p className="text-sm text-t3 mb-5 max-w-xs">
            Erstelle deinen ersten Test, um zwei Prompt-Varianten gegeneinander zu messen.
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ersten Test erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {localTests.map((test) => (
            <div key={test.id} className="card-hover panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-t1">{test.name}</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        test.active
                          ? "text-emerald-500 bg-emerald-400/12 border border-emerald-400/20"
                          : "text-t3 bg-black/5 dark:bg-white/5 border border-[color:var(--panel-border)]"
                      }`}
                    >
                      {test.active ? "Aktiv" : "Pausiert"}
                    </span>
                  </div>

                  {/* Prompt comparison */}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div
                      className="rounded-xl border border-indigo-500/20 px-3 py-2.5"
                      style={{ background: "rgba(99,102,241,0.07)" }}
                    >
                      <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Variant A &middot; {test.weight_a}%</div>
                      <div className="text-sm text-t2 font-mono truncate">
                        {test.prompt_a?.name ?? test.prompt_a_id}
                      </div>
                    </div>
                    <div
                      className="rounded-xl border border-purple-500/20 px-3 py-2.5"
                      style={{ background: "rgba(168,85,247,0.07)" }}
                    >
                      <div className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-1">Variant B &middot; {test.weight_b}%</div>
                      <div className="text-sm text-t2 font-mono truncate">
                        {test.prompt_b?.name ?? test.prompt_b_id}
                      </div>
                    </div>
                  </div>

                  {/* Visual weight bar */}
                  <div className="mt-3 flex h-1.5 rounded-full overflow-hidden gap-0.5">
                    <div
                      className="rounded-l-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all"
                      style={{ width: `${test.weight_a}%` }}
                    />
                    <div
                      className="rounded-r-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all"
                      style={{ width: `${test.weight_b}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(test.id, test.active)}
                    disabled={isPending}
                    className="text-t3 hover:text-indigo-500 transition-colors"
                    title={test.active ? "Pausieren" : "Aktivieren"}
                  >
                    {test.active
                      ? <ToggleRight className="h-6 w-6 text-emerald-500" />
                      : <ToggleLeft className="h-6 w-6" />}
                  </button>
                  <button
                    onClick={() => handleDelete(test.id)}
                    disabled={isPending}
                    className="text-t4 hover:text-rose-500 transition-colors"
                    title="Löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pro plan hint */}
      <div
        className="mt-6 flex items-center gap-3 rounded-xl border border-indigo-500/18 px-4 py-3.5 text-sm"
        style={{ background: "rgba(99,102,241,0.05)" }}
      >
        <Zap className="h-4 w-4 text-indigo-500 shrink-0" />
        <span className="text-t2">
          A/B-Tests sind ein <span className="font-semibold text-indigo-500">Pro-Feature</span>. Upgraden, um unbegrenzte Tests zu erstellen.
        </span>
      </div>
    </div>
  );
}
