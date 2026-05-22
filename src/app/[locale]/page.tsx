import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GdprBanner } from "@/components/GdprBanner";
import {
  FileText,
  Shield,
  Zap,
  GitBranch,
  Terminal,
  Download,
  CheckCircle,
  ArrowRight,
  Star,
} from "lucide-react";

export default function HomePage() {
  const t = useTranslations("landing");

  const features = [
    { key: "editor", icon: FileText },
    { key: "versioning", icon: GitBranch },
    { key: "api", icon: Terminal },
    { key: "export", icon: Download },
    { key: "compliance", icon: Shield },
    { key: "ide", icon: Zap },
  ] as const;

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">PC</div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">ProCon</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              Anmelden
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 sm:py-32">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            <Zap className="h-3.5 w-3.5" />
            {t("hero.badge")}
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-6xl">
            {t("hero.title")}{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {t("hero.titleHighlight")}
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            {t("hero.description")}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/25"
            >
              {t("hero.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 text-base font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center justify-center gap-1 text-sm text-zinc-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2">Trusted by WAMOCON GmbH</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-20 bg-zinc-50 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t("features.title")}</h2>
            <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">{t("features.subtitle")}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ key, icon: Icon }) => (
              <div
                key={key}
                className="rounded-xl border border-zinc-200 bg-white p-6 hover:border-indigo-200 hover:shadow-md transition-all dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-indigo-800"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
                  {t(`features.${key}.title`)}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {t(`features.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{t("pricing.title")}</h2>
            <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400">{t("pricing.subtitle")}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-zinc-200 p-8 dark:border-zinc-800">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t("pricing.free.name")}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">{t("pricing.free.price")}</span>
                <span className="text-zinc-500">{t("pricing.free.period")}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {(t.raw("pricing.free.features") as string[]).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 block w-full rounded-xl border border-zinc-300 py-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {t("pricing.free.cta")}
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 p-8 dark:from-indigo-900/20 dark:to-purple-900/20">
              <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-0.5 text-xs font-semibold text-white">
                {t("pricing.pro.badge")}
              </div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t("pricing.pro.name")}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">{t("pricing.pro.price")}</span>
                <span className="text-zinc-500">{t("pricing.pro.period")}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {(t.raw("pricing.pro.features") as string[]).map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <CheckCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 block w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-center text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-lg"
              >
                {t("pricing.pro.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50 px-4 py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-indigo-600 text-white font-bold text-xs">PC</div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">ProCon</span>
          </div>
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} WAMOCON GmbH. {t("footer.rights")}
          </p>
          <nav className="flex gap-4 text-sm text-zinc-500">
            <Link href="/legal/impressum" className="hover:text-zinc-700 dark:hover:text-zinc-300">{t("footer.impressum")}</Link>
            <Link href="/legal/datenschutz" className="hover:text-zinc-700 dark:hover:text-zinc-300">{t("footer.datenschutz")}</Link>
            <Link href="/legal/agb" className="hover:text-zinc-700 dark:hover:text-zinc-300">{t("footer.agb")}</Link>
          </nav>
        </div>
      </footer>

      <GdprBanner />
    </div>
  );
}
