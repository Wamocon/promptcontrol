import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * MCP (Model Context Protocol) Server for ProCon
 * Allows GitHub Copilot and other IDE tools to query prompts directly.
 *
 * Usage in .vscode/mcp.json:
 * {
 *   "servers": {
 *     "procon": {
 *       "type": "http",
 *       "url": "http://localhost:3000/api/mcp",
 *       "headers": { "X-Api-Key": "<your-api-key>" }
 *     }
 *   }
 * }
 */

const schema = process.env.SUPABASE_DB_SCHEMA ?? "promptcontrol_dev";

function createSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema }, cookies: { getAll: () => [], setAll: () => {} } }
  );
}

// MCP tool definitions
const TOOLS = [
  {
    name: "list_prompts",
    description: "List all active prompts in the organization. Returns slug, name, and description.",
    inputSchema: {
      type: "object",
      properties: {
        project_slug: { type: "string", description: "Optional: filter by project slug" },
        category: { type: "string", description: "Optional: filter by category name" },
      },
    },
  },
  {
    name: "get_prompt",
    description: "Retrieve the full content of a specific prompt by its slug.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The prompt slug" },
      },
      required: ["slug"],
    },
  },
  {
    name: "search_prompts",
    description: "Search prompts by name or description.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_skills",
    description:
      "List all active skills in the shared org-wide skill library. Returns slug, name, description, and category. Use this to discover which reusable skills exist before writing new instructions from scratch.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Optional: filter by category name" },
      },
    },
  },
  {
    name: "get_skill",
    description:
      "Retrieve the full Markdown content of a skill by its slug, ready to follow as instructions. Mentions attached files if the skill has any (fetch them via the download endpoint).",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "The skill slug" },
      },
      required: ["slug"],
    },
  },
  {
    name: "search_skills",
    description: "Search the shared skill library by name or description.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_skill_categories",
    description: "List all skill categories in the organization (e.g. Entwicklung, Test).",
    inputSchema: { type: "object", properties: {} },
  },
];

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "X-Api-Key header required" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();

  // Validate API key
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, org_id")
    .eq("api_key", apiKey)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { method, params } = body;

  // MCP protocol: initialize
  if (method === "initialize") {
    return NextResponse.json({
      protocolVersion: "2024-11-05",
      serverInfo: { name: "ProCon MCP Server", version: "1.0.0" },
      capabilities: { tools: {} },
    });
  }

  // MCP protocol: tools/list
  if (method === "tools/list") {
    return NextResponse.json({ tools: TOOLS });
  }

  // MCP protocol: tools/call
  if (method === "tools/call") {
    const { name, arguments: args } = params;

    if (name === "list_prompts") {
      const query = supabase
        .from("prompts")
        .select("slug, name, description, status, prompt_categories(name), projects(name, slug)")
        .eq("org_id", profile.org_id)
        .eq("status", "active");

      const { data: prompts } = await query;
      return NextResponse.json({
        content: [
          {
            type: "text",
            text: JSON.stringify(prompts ?? [], null, 2),
          },
        ],
      });
    }

    if (name === "get_prompt") {
      const { data: prompt } = await supabase
        .from("prompts")
        .select("*")
        .eq("org_id", profile.org_id)
        .eq("slug", args.slug)
        .single();

      if (!prompt) {
        return NextResponse.json({
          content: [{ type: "text", text: `Prompt '${args.slug}' not found.` }],
          isError: true,
        });
      }

      return NextResponse.json({
        content: [
          {
            type: "text",
            text: `# ${prompt.name}\n\n${prompt.description ? `*${prompt.description}*\n\n` : ""}${prompt.content}`,
          },
        ],
      });
    }

    if (name === "search_prompts") {
      const { data: prompts } = await supabase
        .from("prompts")
        .select("slug, name, description, content")
        .eq("org_id", profile.org_id)
        .eq("status", "active")
        .or(`name.ilike.%${args.query}%,description.ilike.%${args.query}%`);

      return NextResponse.json({
        content: [
          {
            type: "text",
            text: JSON.stringify(prompts ?? [], null, 2),
          },
        ],
      });
    }

    if (name === "list_skills") {
      let query = supabase
        .from("skills")
        .select("slug, name, description, status, skill_categories(name)")
        .eq("org_id", profile.org_id)
        .eq("status", "active");

      if (args?.category) {
        const { data: cat } = await supabase
          .from("skill_categories")
          .select("id")
          .eq("org_id", profile.org_id)
          .ilike("name", args.category)
          .single();
        if (cat) query = query.eq("category_id", cat.id);
      }

      const { data: skills } = await query;
      return NextResponse.json({
        content: [{ type: "text", text: JSON.stringify(skills ?? [], null, 2) }],
      });
    }

    if (name === "get_skill") {
      const { data: skill } = await supabase
        .from("skills")
        .select("*, files:skill_files(path)")
        .eq("org_id", profile.org_id)
        .eq("slug", args.slug)
        .single();

      if (!skill) {
        return NextResponse.json({
          content: [{ type: "text", text: `Skill '${args.slug}' not found.` }],
          isError: true,
        });
      }

      const filesNote =
        skill.files && skill.files.length > 0
          ? `\n\n*Zusatzdateien (${skill.files.map((f: { path: string }) => f.path).join(", ")}) verfügbar über GET /api/v1/skills/${skill.slug}/download*`
          : "";

      return NextResponse.json({
        content: [
          {
            type: "text",
            text: `# ${skill.name}\n\n${skill.description ? `*${skill.description}*\n\n` : ""}${skill.content}${filesNote}`,
          },
        ],
      });
    }

    if (name === "search_skills") {
      const { data: skills } = await supabase
        .from("skills")
        .select("slug, name, description, content")
        .eq("org_id", profile.org_id)
        .eq("status", "active")
        .or(`name.ilike.%${args.query}%,description.ilike.%${args.query}%`);

      return NextResponse.json({
        content: [{ type: "text", text: JSON.stringify(skills ?? [], null, 2) }],
      });
    }

    if (name === "list_skill_categories") {
      const { data: categories } = await supabase
        .from("skill_categories")
        .select("name, color")
        .eq("org_id", profile.org_id);

      return NextResponse.json({
        content: [{ type: "text", text: JSON.stringify(categories ?? [], null, 2) }],
      });
    }

    return NextResponse.json({ error: `Unknown tool: ${name}` }, { status: 400 });
  }

  return NextResponse.json({ error: `Unknown method: ${method}` }, { status: 400 });
}

// Info endpoint for MCP server
export async function GET() {
  return NextResponse.json({
    name: "ProCon MCP Server",
    version: "1.0.0",
    description: "MCP server for ProCon prompt management. Use POST with X-Api-Key header.",
    tools: TOOLS.map((t) => t.name),
  });
}
