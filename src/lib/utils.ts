import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatCost(usd: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
  }).format(usd);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Baut den Markdown-Text eines Skills im SKILL.md-Format (YAML-Frontmatter + Inhalt). */
export function buildSkillMarkdown({
  name,
  description,
  content,
}: {
  name: string;
  description: string;
  content: string;
}) {
  return `---\nname: ${slugify(name) || name}\ndescription: "${(description || name).replace(/"/g, '\\"')}"\n---\n\n${content}\n`;
}

/** Kehrt buildSkillMarkdown() um: liest eine SKILL.md und trennt Frontmatter von Inhalt. */
export function parseSkillMarkdown(raw: string): { name: string; description: string; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { name: "", description: "", content: raw.trim() };
  }
  const [, frontmatter, body] = match;
  let name = "";
  let description = "";
  for (const line of frontmatter.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "name") name = value;
    if (key === "description") description = value;
  }
  return { name, description, content: body.trim() };
}
