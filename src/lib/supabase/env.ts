/**
 * Centralised, defensive access to Supabase environment variables.
 *
 * Why this exists:
 *  - On Vercel, missing env vars caused 500 errors at request time because
 *    `process.env.X!` evaluated to `undefined` and was passed to the
 *    Supabase client constructor.
 *  - We now surface a typed `ConfigStatus` so callers can decide whether to
 *    short-circuit (return a redirect, render a friendly hint, etc.) instead
 *    of crashing with an opaque 500.
 */

export const SUPABASE_SCHEMA: string =
  process.env.SUPABASE_DB_SCHEMA ??
  process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ??
  "promptcontrol_dev";

export interface PublicConfig {
  url: string;
  anonKey: string;
}

export interface ServiceConfig extends PublicConfig {
  serviceRoleKey: string;
}

export function getPublicConfig(): PublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function getServiceConfig(): ServiceConfig | null {
  const base = getPublicConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !serviceRoleKey) return null;
  return { ...base, serviceRoleKey };
}

export function isSupabaseConfigured(): boolean {
  return getPublicConfig() !== null;
}
