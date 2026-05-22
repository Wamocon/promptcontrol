import { createBrowserClient } from "@supabase/ssr";

const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "promptcontrol_dev";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema },
    }
  );
}
