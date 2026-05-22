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
