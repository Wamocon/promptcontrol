"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    // Create org + profile
    const orgSlug = slugify(orgName) + "-" + Date.now().toString(36);
    const { data: org } = await supabase
      .from("organizations")
      .insert({ name: orgName, slug: orgSlug })
      .select()
      .single();

    if (org) {
      await supabase.from("profiles").insert({
        user_id: data.user.id,
        org_id: org.id,
        name,
        email,
        role: "admin",
      });
    }
  }

  redirect(`/${locale}/dashboard`);
}

export async function logout(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/auth/login`);
}
