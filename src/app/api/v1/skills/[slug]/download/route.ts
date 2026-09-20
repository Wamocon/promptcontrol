import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import JSZip from "jszip";
import { createClientSafe } from "@/lib/supabase/server";
import { buildSkillMarkdown } from "@/lib/utils";

const schema = process.env.SUPABASE_DB_SCHEMA ?? "promptcontrol_dev";

function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema }, cookies: { getAll: () => [], setAll: () => {} } }
  );
}

/**
 * Liefert ein Skill-Paket herunterladbar aus: als reine SKILL.md, wenn keine
 * Zusatzdateien existieren, sonst als ZIP mit SKILL.md + Anhaengen.
 *
 * Auth: entweder eine eingeloggte Dashboard-Session (Klick auf "Herunterladen"
 * im Browser) oder ein X-Api-Key-Header/Query-Param (externe Nutzung, curl,
 * CI). Session hat Vorrang, damit der In-App-Button ohne Zusatzparameter
 * funktioniert.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const service = createServiceClient();

  let orgId: string | null = null;

  const sessionClient = await createClientSafe();
  if (sessionClient) {
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    if (user) {
      const { data: profile } = await sessionClient
        .from("profiles")
        .select("org_id")
        .eq("user_id", user.id)
        .single();
      orgId = profile?.org_id ?? null;
    }
  }

  if (!orgId) {
    const apiKey =
      request.headers.get("x-api-key") ??
      request.nextUrl.searchParams.get("api_key");
    if (!apiKey) {
      return NextResponse.json({ error: "Nicht angemeldet und kein API-Key übergeben." }, { status: 401 });
    }
    const { data: profile } = await service
      .from("profiles")
      .select("org_id")
      .eq("api_key", apiKey)
      .single();
    if (!profile) {
      return NextResponse.json({ error: "Ungültiger API-Key." }, { status: 401 });
    }
    orgId = profile.org_id;
  }

  const { data: skill } = await service
    .from("skills")
    .select("name, slug, description, content, files:skill_files(path, storage_path, content_type)")
    .eq("slug", slug)
    .eq("org_id", orgId)
    .single();

  if (!skill) {
    return NextResponse.json({ error: `Skill '${slug}' nicht gefunden.` }, { status: 404 });
  }

  const markdown = buildSkillMarkdown({
    name: skill.name,
    description: skill.description,
    content: skill.content,
  });

  const files = (skill.files ?? []) as { path: string; storage_path: string; content_type: string }[];

  // Immer als ZIP mit SKILL.md ausliefern, auch ohne Zusatzdateien: Claude
  // Code/Claude Desktop erwarten einen Ordner mit einer Datei, die exakt
  // "SKILL.md" heisst, nicht eine lose Datei mit beliebigem Namen. Wird das
  // ZIP normal entpackt (z.B. Windows "Alle extrahieren"), entsteht direkt
  // ein Ordner mit korrektem Namen und SKILL.md darin, einsatzbereit.
  const zip = new JSZip();
  zip.file("SKILL.md", markdown);
  for (const f of files) {
    const { data: blob } = await service.storage.from("skill-files").download(f.storage_path);
    if (blob) {
      zip.file(f.path, Buffer.from(await blob.arrayBuffer()));
    }
  }
  const buffer = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(new Blob([buffer]), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${skill.slug}.zip"`,
    },
  });
}
