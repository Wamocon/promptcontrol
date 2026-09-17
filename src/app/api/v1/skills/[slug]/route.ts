import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const schema = process.env.SUPABASE_DB_SCHEMA ?? "promptcontrol_dev";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const apiKey =
    request.headers.get("x-api-key") ??
    request.nextUrl.searchParams.get("api_key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key required. Pass via X-Api-Key header or ?api_key= query param." },
      { status: 401 }
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema }, cookies: { getAll: () => [], setAll: () => {} } }
  );

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id")
    .eq("api_key", apiKey)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  const { data: skill } = await supabase
    .from("skills")
    .select("id, name, slug, description, content, status, current_version, updated_at, files:skill_files(path, content_type, size_bytes)")
    .eq("slug", slug)
    .eq("org_id", profile.org_id)
    .eq("status", "active")
    .single();

  if (!skill) {
    return NextResponse.json(
      { error: `Skill '${slug}' not found or not active.` },
      { status: 404 }
    );
  }

  return NextResponse.json(skill, {
    headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
  });
}
