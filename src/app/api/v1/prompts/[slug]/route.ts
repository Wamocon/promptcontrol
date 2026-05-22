import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const schema = process.env.SUPABASE_DB_SCHEMA ?? "promptcontrol_dev";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const start = Date.now();

  // Authenticate via API key header or query param
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
    {
      db: { schema },
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );

  // Validate API key
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id, organizations(plan)")
    .eq("api_key", apiKey)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  // Get prompt by slug (org-scoped)
  const { data: prompt } = await supabase
    .from("prompts")
    .select("id, name, slug, content, status, current_version, updated_at")
    .eq("slug", slug)
    .eq("org_id", profile.org_id)
    .eq("status", "active")
    .single();

  const latency = Date.now() - start;

  if (!prompt) {
    return NextResponse.json(
      { error: `Prompt '${slug}' not found or not active.` },
      { status: 404 }
    );
  }

  // Log the API call
  await supabase.from("prompt_logs").insert({
    org_id: profile.org_id,
    prompt_id: prompt.id,
    prompt_slug: slug,
    latency_ms: latency,
    status: "success",
  });

  return NextResponse.json(
    {
      slug: prompt.slug,
      name: prompt.name,
      content: prompt.content,
      version: prompt.current_version,
      updated_at: prompt.updated_at,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        "X-Latency-Ms": String(latency),
      },
    }
  );
}
