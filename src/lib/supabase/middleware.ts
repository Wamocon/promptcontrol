import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getPublicConfig, SUPABASE_SCHEMA } from "./env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const config = getPublicConfig();
  if (!config) {
    // Missing env vars: do NOT crash the middleware. Public routes
    // (landing, /auth/login) must keep rendering so the operator can
    // diagnose the misconfiguration. Authenticated routes will redirect
    // to /auth/login because no session can be resolved.
    return supabaseResponse;
  }

  const supabase = createServerClient(config.url, config.anonKey, {
    db: { schema: SUPABASE_SCHEMA },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch {
    // Token refresh failure must not 500 the entire request.
  }

  return supabaseResponse;
}
