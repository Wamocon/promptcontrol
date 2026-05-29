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
    <div className="relative flex min-h-screen items-center justify-center bg-[#060a13] px-4 py-10">
      <div className="aurora-bg" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
        <div className="mb-8 flex flex-col items-center">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-2xl text-white font-extrabold text-xl mb-4 shadow-2xl"
            style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", boxShadow: "0 0 40px rgba(99,102,241,0.35)" }}
          >
            PC
          </div>
          <h1 className="text-2xl font-bold text-white/90">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-white/40">{t("subtitle")}</p>
        </div>

        <div
          className="rounded-2xl border border-white/8 p-7 shadow-2xl"
          style={{ background: "rgba(12,17,32,0.75)", backdropFilter: "blur(24px)" }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
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

        <p className="mt-5 text-center text-sm text-white/35">
          {t("hasAccount")}{" "}
          <Link href="/auth/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}

