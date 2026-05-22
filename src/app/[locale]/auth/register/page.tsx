"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useState, useTransition } from "react";
import { register } from "../actions";
import { useParams } from "next/navigation";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const params = useParams();
  const locale = (params.locale as string) || "de";
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirmPassword") as string;
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    startTransition(async () => {
      const result = await register(formData, locale);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-xl mb-3">
            PC
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t("subtitle")}</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
            <Input
              id="name"
              name="name"
              type="text"
              label={t("name")}
              placeholder="Max Mustermann"
              autoComplete="name"
              required
            />
            <Input
              id="email"
              name="email"
              type="email"
              label={t("email")}
              placeholder="name@firma.de"
              autoComplete="email"
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label={t("password")}
              placeholder="Mindestens 8 Zeichen"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label={t("confirmPassword")}
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
            <Button type="submit" loading={isPending} className="w-full mt-2">
              {t("submit")}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {t("hasAccount")}{" "}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
