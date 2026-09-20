import { createClient, createServiceClientSafe } from "@/lib/supabase/server";
import { UsersClient } from "./UsersClient";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*, organizations(name, plan)")
    .order("created_at", { ascending: false });

  // Fuer das Organisation-Dropdown werden ALLE Organisationen benoetigt,
  // nicht nur die eigene. Die normale organizations-Select-Policy blendet
  // fremde Organisationen aus (RLS: id = current_org_id()), daher hier der
  // Service-Client.
  const service = await createServiceClientSafe();
  const { data: organizations } = service
    ? await service.from("organizations").select("id, name").order("name")
    : { data: null };

  return <UsersClient users={users ?? []} organizations={organizations ?? []} />;
}
