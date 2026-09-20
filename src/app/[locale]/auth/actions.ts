"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function login(formData: FormData, locale: string) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/dashboard`);
}

export async function register(formData: FormData, locale: string) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const orgName = (formData.get("org_name") as string) || `${name}'s Team`;
  const inviteToken = formData.get("invite_token") as string | null;

  // Bei einem Einladungslink zuerst pruefen, dass die Einladung noch gilt,
  // bevor der Auth-User angelegt wird (sonst existiert ein User ohne
  // gueltige Org-Zuordnung).
  let invite: { id: string; org_id: string; role: string; email: string } | null = null;
  if (inviteToken) {
    const { data } = await supabase
      .from("team_invitations")
      .select("id, org_id, role, email")
      .eq("token", inviteToken)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();
    if (!data) {
      return { error: "Diese Einladung ist ungültig oder abgelaufen." };
    }
    invite = data;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    if (invite) {
      // Bestehender Organisation beitreten statt eine neue anzulegen.
      const { error: profileErr } = await supabase.from("profiles").insert({
        user_id: data.user.id,
        org_id: invite.org_id,
        name,
        email,
        role: invite.role,
      });
      if (profileErr) return { error: profileErr.message };
      await supabase
        .from("team_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id);
    } else {
      // Kein Einladungslink: diese Instanz gehoert genau einer Organisation.
      // Existiert sie schon, tritt der neue Nutzer ihr als Mitglied bei,
      // statt eine weitere, isolierte Organisation anzulegen (frueherer
      // Bug: jede Selbstregistrierung erzeugte eine eigene Organisation).
      // Nur wenn die Instanz noch komplett leer ist, wird eine neue
      // Organisation samt Admin-Rolle angelegt (Erstregistrierung). Die
      // Sichtbarkeit bestehender Organisationen ist per RLS auf eigene
      // Mitglieder beschraenkt, daher hier der Service-Client.
      const service = await createServiceClient();
      const { data: existingOrg } = await service
        .from("organizations")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingOrg) {
        const { error: profileErr } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          org_id: existingOrg.id,
          name,
          email,
          role: "trainee",
        });
        if (profileErr) return { error: profileErr.message };
      } else {
        const orgSlug = slugify(orgName) + "-" + Date.now().toString(36);
        const { data: org, error: orgErr } = await supabase
          .from("organizations")
          .insert({ name: orgName, slug: orgSlug })
          .select()
          .single();
        if (orgErr) return { error: orgErr.message };

        const { error: profileErr } = await supabase.from("profiles").insert({
          user_id: data.user.id,
          org_id: org.id,
          name,
          email,
          role: "admin",
        });
        if (profileErr) return { error: profileErr.message };
      }
    }
  }

  redirect(`/${locale}/dashboard`);
}

export async function logout(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/auth/login`);
}
