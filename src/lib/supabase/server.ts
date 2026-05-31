import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicConfig, getServiceConfig, SUPABASE_SCHEMA } from "./env";

/**
 * Cookie adapter that tolerates being called from a Server Component
 * (where mutating the cookie store throws).
 */
async function buildCookieAdapter() {
  const cookieStore = await cookies();
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Server Component context - cookies are read-only here.
      }
    },
  };
}

/**
 * Returns an anon Supabase client, or `null` if env vars are missing.
 * Callers MUST handle the null case so a misconfigured deploy renders
 * a friendly hint instead of a 500.
 */
export async function createClientSafe() {
  const config = getPublicConfig();
  if (!config) return null;
  const cookieAdapter = await buildCookieAdapter();
  return createServerClient(config.url, config.anonKey, {
    db: { schema: SUPABASE_SCHEMA },
    cookies: cookieAdapter,
  });
}

/**
 * Throwing anon client. Use inside Server Actions / API routes where a
 * 500 is acceptable and a descriptive error helps debugging.
 */
export async function createClient() {
  const client = await createClientSafe();
  if (!client) {
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return client;
}

/**
 * Safe service-role client. Returns `null` if the service role key is
 * missing so callers can fall back to anon-scope queries.
 */
export async function createServiceClientSafe() {
  const config = getServiceConfig();
  if (!config) return null;
  const cookieAdapter = await buildCookieAdapter();
  return createServerClient(config.url, config.serviceRoleKey, {
    db: { schema: SUPABASE_SCHEMA },
    cookies: cookieAdapter,
  });
}

/**
 * Throwing service-role client (legacy). Prefer the Safe variant inside
 * Server Components so a missing env var degrades gracefully.
 */
export async function createServiceClient() {
  const client = await createServiceClientSafe();
  if (!client) {
    throw new Error(
      "Supabase service role is not configured: set SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return client;
}
