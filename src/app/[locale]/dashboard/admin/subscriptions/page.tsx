import { createClient } from "@/lib/supabase/server";
import { SubscriptionsClient } from "./SubscriptionsClient";

export default async function AdminSubscriptionsPage() {
  const supabase = await createClient();

  const { data: organizations } = await supabase
    .from("organizations")
    .select("*, profiles(count)")
    .order("created_at", { ascending: false });

  return <SubscriptionsClient organizations={organizations ?? []} />;
}
