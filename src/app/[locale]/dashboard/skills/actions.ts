"use server";

import { revalidatePath } from "next/cache";
import JSZip from "jszip";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify, parseSkillMarkdown } from "@/lib/utils";
import { autoChat } from "@/lib/ai/client";

const BUCKET = "skill-files";

async function requireProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet" as const };

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile) return { error: "Profil nicht gefunden" as const };
  return { supabase, profile };
}

export async function createSkill(formData: FormData) {
  const ctx = await requireProfile();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const name = formData.get("name") as string;
  const content = (formData.get("content") as string) ?? "";
  const description = (formData.get("description") as string) ?? "";
  const categoryId = formData.get("category_id") as string;
  const slug = slugify(name) || name.toLowerCase().replace(/\s+/g, "-");

  const { data: skill, error } = await supabase
    .from("skills")
    .insert({
      org_id: profile.org_id,
      name,
      slug,
      description: description || "",
      content,
      category_id: categoryId || null,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await supabase.from("skill_versions").insert({
    skill_id: skill.id,
    version: 1,
    content,
    change_note: "Erste Version",
    created_by: profile.id,
  });

  revalidatePath("/dashboard/skills");
  return { error: null, skillId: skill.id };
}

export async function updateSkill(
  skillId: string,
  formData: FormData,
  saveAsVersion: boolean
) {
  const ctx = await requireProfile();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const name = formData.get("name") as string;
  const content = (formData.get("content") as string) ?? "";
  const description = (formData.get("description") as string) ?? "";
  const status = formData.get("status") as string;
  const categoryId = formData.get("category_id") as string;
  const changeNote = formData.get("change_note") as string;

  const { data: current } = await supabase
    .from("skills")
    .select("current_version")
    .eq("id", skillId)
    .single();

  const newVersion = saveAsVersion ? (current?.current_version ?? 1) + 1 : current?.current_version ?? 1;

  const { error } = await supabase
    .from("skills")
    .update({
      name,
      content,
      description: description || "",
      status,
      category_id: categoryId || null,
      current_version: newVersion,
    })
    .eq("id", skillId);

  if (error) return { error: error.message };

  if (saveAsVersion) {
    await supabase.from("skill_versions").insert({
      skill_id: skillId,
      version: newVersion,
      content,
      change_note: changeNote || null,
      created_by: profile.id,
    });
  }

  revalidatePath("/dashboard/skills");
  return { error: null };
}

export async function deleteSkill(skillId: string) {
  const ctx = await requireProfile();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const { data: skill } = await supabase
    .from("skills")
    .select("created_by")
    .eq("id", skillId)
    .single();

  const canDelete =
    skill?.created_by === profile.id || profile.role === "admin" || profile.role === "pm";
  if (!canDelete) {
    return { error: "Nur Ersteller, PM oder Admin dürfen diesen Skill löschen." };
  }

  // Zusatzdateien im Storage-Bucket mit aufräumen.
  const { data: files } = await supabase
    .from("skill_files")
    .select("storage_path")
    .eq("skill_id", skillId);
  if (files && files.length > 0) {
    const service = await createServiceClient();
    await service.storage
      .from(BUCKET)
      .remove(files.map((f) => f.storage_path));
  }

  const { error } = await supabase.from("skills").delete().eq("id", skillId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/skills");
  return { error: null };
}

export async function rollbackSkillVersion(skillId: string, versionId: string) {
  const ctx = await requireProfile();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const { data: version } = await supabase
    .from("skill_versions")
    .select("content, version")
    .eq("id", versionId)
    .single();
  if (!version) return { error: "Version nicht gefunden" };

  const { data: current } = await supabase
    .from("skills")
    .select("current_version")
    .eq("id", skillId)
    .single();
  const newVersion = (current?.current_version ?? 1) + 1;

  const { error } = await supabase
    .from("skills")
    .update({ content: version.content, current_version: newVersion })
    .eq("id", skillId);
  if (error) return { error: error.message };

  await supabase.from("skill_versions").insert({
    skill_id: skillId,
    version: newVersion,
    content: version.content,
    change_note: `Rollback zu Version ${version.version}`,
    created_by: profile.id,
  });

  revalidatePath("/dashboard/skills");
  return { error: null };
}

export async function createSkillCategory(formData: FormData) {
  const ctx = await requireProfile();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const name = formData.get("name") as string;
  const color = (formData.get("color") as string) || "#6366f1";

  const { data: category, error } = await supabase
    .from("skill_categories")
    .insert({ org_id: profile.org_id, name, color })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/dashboard/skills");
  return { error: null, category };
}

export async function uploadSkillFile(skillId: string, formData: FormData) {
  const ctx = await requireProfile();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Keine Datei übergeben" };

  const storagePath = `${profile.org_id}/${skillId}/${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const service = await createServiceClient();
  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
  if (uploadError) return { error: uploadError.message };

  const { error } = await supabase.from("skill_files").upsert(
    {
      skill_id: skillId,
      path: file.name,
      storage_path: storagePath,
      content_type: file.type || "application/octet-stream",
      size_bytes: buffer.byteLength,
    },
    { onConflict: "skill_id,path" }
  );
  if (error) return { error: error.message };

  revalidatePath("/dashboard/skills");
  return { error: null };
}

export async function deleteSkillFile(fileId: string) {
  const ctx = await requireProfile();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase } = ctx;

  const { data: file } = await supabase
    .from("skill_files")
    .select("storage_path")
    .eq("id", fileId)
    .single();
  if (!file) return { error: "Datei nicht gefunden" };

  const service = await createServiceClient();
  await service.storage.from(BUCKET).remove([file.storage_path]);

  const { error } = await supabase.from("skill_files").delete().eq("id", fileId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/skills");
  return { error: null };
}

/**
 * Laesst die KI Namen, Beschreibung und Inhalt eines Skills aufbereiten:
 * klarerer Titel, praegnante Ein-Satz-Beschreibung, sauber formatierter
 * Inhalt. Fachliche Aussagen bleiben erhalten, nur Form und Klarheit
 * werden verbessert. Speichert das Ergebnis als neue Version.
 */
export async function polishSkillWithAI(skillId: string) {
  const ctx = await requireProfile();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const { data: skill } = await supabase
    .from("skills")
    .select("id, name, description, content, current_version, category_id")
    .eq("id", skillId)
    .single();
  if (!skill) return { error: "Skill nicht gefunden" };

  const { data: categories } = await supabase
    .from("skill_categories")
    .select("id, name, color, org_id, created_at")
    .eq("org_id", profile.org_id)
    .order("name");
  const categoryNames = (categories ?? []).map((c) => c.name);

  const systemPrompt =
    "Du bist ein technischer Redakteur bei WAMOCON. Du bereitest Eintraege einer internen " +
    "Skills-Bibliothek auf. Ueberarbeite den gegebenen Skill: 1) ein kurzer, klarer Name " +
    "(max. 60 Zeichen), 2) eine praegnante Ein-Satz-Beschreibung, die erklaert, wann dieser " +
    "Skill genutzt werden soll (max. 200 Zeichen), 3) die am besten passende Kategorie aus der " +
    "vorgegebenen Liste, keine neue erfinden, 4) den Inhalt sauber formatiert (klare " +
    "Ueberschriften, Listen, keine Redundanzen), aber fachlich unveraendert, es duerfen keine " +
    "Anweisungen oder Informationen verloren gehen. Schreibe in gepflegtem Deutsch ohne " +
    "Gedankenstriche im Fliesstext, gliedere stattdessen mit Kommas oder Satztrennung. " +
    "Verfuegbare Kategorien (exakt so uebernehmen, keine neue Kategorie erfinden): " +
    categoryNames.join(", ") +
    ". Antworte ausschliesslich in exakt diesem Format, ohne zusaetzliche Erklaerungen:\n" +
    "NAME: <name>\nBESCHREIBUNG: <beschreibung>\nKATEGORIE: <ein Name exakt aus der Liste>\n" +
    "INHALT:\n<vollstaendiger ueberarbeiteter Inhalt>";

  const userPrompt = `Name: ${skill.name}\nBeschreibung: ${skill.description}\nInhalt:\n${skill.content}`;

  let text: string;
  try {
    const result = await autoChat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { maxTokens: 4000, temperature: 0.3, timeoutMs: 90_000 }
    );
    text = result.text;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "KI nicht erreichbar" };
  }

  const nameMatch = text.match(/NAME:\s*(.+)/);
  const descMatch = text.match(/BESCHREIBUNG:\s*(.+)/);
  const categoryMatch = text.match(/KATEGORIE:\s*(.+)/);
  const contentMatch = text.match(/INHALT:\s*([\s\S]*)/);

  if (!nameMatch || !descMatch || !contentMatch) {
    return { error: "KI-Antwort konnte nicht geparst werden" };
  }

  const newName = nameMatch[1].trim().slice(0, 200);
  const newDescription = descMatch[1].trim().slice(0, 2000);
  const newContent = contentMatch[1].trim();
  const newVersion = skill.current_version + 1;

  // Kategorie nur uebernehmen, wenn die KI exakt einen Namen aus der
  // vorgegebenen Liste getroffen hat. Ein Freitext-Treffer wuerde die
  // saubere Kategorien-Liste sonst mit Varianten aufblaehen.
  const matchedCategory = categoryMatch
    ? (categories ?? []).find(
        (c) => c.name.toLowerCase() === categoryMatch[1].trim().toLowerCase()
      )
    : undefined;
  const newCategoryId = matchedCategory?.id ?? skill.category_id;

  const { error } = await supabase
    .from("skills")
    .update({
      name: newName,
      description: newDescription,
      content: newContent,
      current_version: newVersion,
      category_id: newCategoryId,
    })
    .eq("id", skillId);
  if (error) return { error: error.message };

  await supabase.from("skill_versions").insert({
    skill_id: skillId,
    version: newVersion,
    content: newContent,
    change_note: "KI-Aufbereitung",
    created_by: profile.id,
  });

  revalidatePath("/dashboard/skills");
  return {
    error: null,
    name: newName,
    description: newDescription,
    content: newContent,
    category: matchedCategory ?? null,
  };
}

/**
 * Importiert einen bestehenden lokalen Skill: entweder eine einzelne
 * SKILL.md (Frontmatter + Inhalt) oder ein ZIP mit SKILL.md plus
 * Zusatzdateien (Scripts, Vorlagen, Bilder).
 */
export async function importSkillMd(formData: FormData) {
  const ctx = await requireProfile();
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, profile } = ctx;

  const file = formData.get("file") as File | null;
  const categoryId = formData.get("category_id") as string;
  if (!file) return { error: "Keine Datei übergeben" };

  let name = "";
  let description = "";
  let content = "";
  let extraFiles: { path: string; buffer: Buffer; contentType: string }[] = [];

  if (file.name.toLowerCase().endsWith(".zip")) {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const skillMdEntry =
      zip.file(/SKILL\.md$/i)[0] ?? zip.file(/\.md$/i)[0];
    if (!skillMdEntry) return { error: "Kein SKILL.md im ZIP gefunden" };
    const parsed = parseSkillMarkdown(await skillMdEntry.async("string"));
    ({ name, description, content } = parsed);

    const entries = Object.values(zip.files).filter(
      (f) => !f.dir && f !== skillMdEntry
    );
    extraFiles = await Promise.all(
      entries.map(async (f) => ({
        path: f.name,
        buffer: Buffer.from(await f.async("arraybuffer")),
        contentType: "application/octet-stream",
      }))
    );
  } else {
    const parsed = parseSkillMarkdown(await file.text());
    ({ name, description, content } = parsed);
  }

  if (!name) name = file.name.replace(/\.(md|zip)$/i, "");
  const slug = slugify(name) || name.toLowerCase().replace(/\s+/g, "-");

  const { data: skill, error } = await supabase
    .from("skills")
    .insert({
      org_id: profile.org_id,
      name,
      slug,
      description,
      content,
      category_id: categoryId || null,
      created_by: profile.id,
    })
    .select()
    .single();
  if (error) return { error: error.message };

  await supabase.from("skill_versions").insert({
    skill_id: skill.id,
    version: 1,
    content,
    change_note: "Import",
    created_by: profile.id,
  });

  if (extraFiles.length > 0) {
    const service = await createServiceClient();
    for (const ef of extraFiles) {
      const storagePath = `${profile.org_id}/${skill.id}/${ef.path}`;
      await service.storage
        .from(BUCKET)
        .upload(storagePath, ef.buffer, { contentType: ef.contentType, upsert: true });
      await supabase.from("skill_files").insert({
        skill_id: skill.id,
        path: ef.path,
        storage_path: storagePath,
        content_type: ef.contentType,
        size_bytes: ef.buffer.byteLength,
      });
    }
  }

  revalidatePath("/dashboard/skills");
  return { error: null, skillId: skill.id };
}
