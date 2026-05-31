import { redirect } from "next/navigation";

/**
 * Settings has been merged into the unified Profile cockpit.
 * The "Abrechnung" tab inside /dashboard/profile now hosts the
 * subscription/billing settings the old page used to expose.
 */
export default async function SettingsRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/profile?tab=billing`);
}
