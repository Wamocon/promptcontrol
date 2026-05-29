import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { GdprBanner } from "@/components/GdprBanner";
import {
  FileText,
  Shield,
  GitBranch,
  Terminal,
  Download,
  CheckCircle,
  ArrowRight,
  Star,
  Code2,
  FlaskConical,
  BarChart2,
} from "lucide-react";

export default function HomePage() {
  const t = useTranslations("landing");

  const features = [
    { key: "editor", icon: FileText, color: "text-indigo-400", bg: "rgba(99,102,241,0.10)", glow: "rgba(99,102,241,0.20)" },
    { key: "versioning", icon: GitBranch, color: "text-purple-400", bg: "rgba(168,85,247,0.10)", glow: "rgba(168,85,247,0.20)" },
    { key: "api", icon: Terminal, color: "text-emerald-400", bg: "rgba(16,185,129,0.10)", glow: "rgba(16,185,129,0.20)" },
    { key: "export", icon: Download, color: "text-cyan-400", bg: "rgba(34,211,238,0.10)", glow: "rgba(34,211,238,0.20)" },
    { key: "compliance", icon: Shield, color: "text-amber-400", bg: "rgba(245,158,11,0.10)", glow: "rgba(245,158,11,0.20)" },
    { key: "ide", icon: Code2, color: "text-rose-400", bg: "rgba(244,63,94,0.10)", glow: "rgba(244,63,94,0.20)" },
  ] as const;

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      {/* Aurora background */}
      <div className="aurora-bg" />

      {/* Header */}
      <header
        className="sticky top-0 z-50 w-full border-b"
        style={{ background: "var(--surface-topbar)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderColor: "var(--panel-border)" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 h-16">
          <div className="flex items-center gap-2.5 font-bold text-lg">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/30">
              PC
            </div>
            <span className="text-indigo-400">Pro</span>
            <span className="text-white/90">Con</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm transition-colors" style={{ color: "var(--text-3)" }}
            >
              {t("hero.ctaSecondary")}
            </Link>
            <Link
              href="/auth/register"
              className="btn-procon rounded-xl px-5 py-2 text-sm"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative flex-1 z-10">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pt-28 pb-32 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-sm text-indigo-400 mb-10">
            <span className="ping-dot text-indigo-400" />
            {t("hero.badge")}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            {t("hero.title")}{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t("hero.titleHighlight")}
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/50 mb-12 leading-relaxed">
            {t("hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
            <Link
              href="/auth/register"
              className="btn-procon inline-flex items-center justify-center gap-2 rounded-xl px-9 py-4 text-base font-semibold"
            >
              {t("hero.cta")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-9 py-4 text-base font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ border: "1px solid var(--panel-border-strong)", color: "var(--text-2)" }}
            >
              {t("hero.ctaSecondary")}
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-1 text-sm text-white/30">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2">Vertraut von WAMOCON GmbH</span>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-xl mx-auto">
            {[
              { value: "5h+", label: "Entwicklerzeit/Woche gespart" },
              { value: "30%", label: "Weniger API-Kosten" },
              { value: "4 Rollen", label: "Team-Zugangsstufen" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="rounded-xl p-4 panel-subtle"
              >
                <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
                <div className="mt-1 text-xs text-white/35 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{t("features.title")}</h2>
              <p className="mt-3 text-lg text-white/45">{t("features.subtitle")}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ key, icon: Icon, color, bg, glow }) => (
                <div
                  key={key}
                  className="card-hover glass-card p-6"
                >
                  <div
                    className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                    style={{ background: bg, boxShadow: `0 0 20px ${glow}` }}
                  >
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <h3 className="mb-2 font-semibold text-white/90">
                    {t(`features.${key}.title`)}
                  </h3>
                  <p className="text-sm text-white/45 leading-relaxed">
                    {t(`features.${key}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">So funktioniert ProCon</h2>
              <p className="mt-3 text-white/45">In drei Schritten zum vollständigen Prompt-Management</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { step: "01", icon: FileText, title: "Prompt erstellen", desc: "Schreibe und strukturiere Prompts im visuellen Editor. Kategorisiere nach Abteilung, Rolle oder Thema.", color: "text-indigo-400", glow: "rgba(99,102,241,0.25)" },
                { step: "02", icon: GitBranch, title: "Versionieren & testen", desc: "Jede Änderung wird versioniert. A/B-Tests zeigen dir welche Variante besser performt.", color: "text-purple-400", glow: "rgba(168,85,247,0.25)" },
                { step: "03", icon: Terminal, title: "Überall integrieren", desc: "REST-API oder direkt per MCP aus GitHub Copilot - deine Prompts, überall verfügbar.", color: "text-emerald-400", glow: "rgba(16,185,129,0.25)" },
              ].map(({ step, icon: Icon, title, desc, color, glow }) => (
                <div key={step} className="relative text-center">
                  <div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: "var(--panel-bg)", border: "1px solid var(--panel-border)", boxShadow: `0 0 30px ${glow}` }}
                  >
                    <Icon className={`h-7 w-7 ${color}`} />
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/20 tracking-widest">{step}</div>
                  <h3 className="font-semibold text-white/90 mb-2">{title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{t("pricing.title")}</h2>
              <p className="mt-3 text-white/45">{t("pricing.subtitle")}</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Free */}
              <div
                className="glass-card p-8"
              >
                <h3 className="text-xl font-bold text-white/90">{t("pricing.free.name")}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{t("pricing.free.price")}</span>
                  <span className="text-white/40">{t("pricing.free.period")}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {(t.raw("pricing.free.features") as string[]).map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                      <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className="mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ border: "1px solid var(--panel-border-strong)", color: "var(--text-2)" }}
                >
                  {t("pricing.free.cta")}
                </Link>
              </div>

              {/* Pro */}
              <div
                className="relative rounded-2xl border border-indigo-500/30 p-8 glow-primary"
                style={{ background: "rgba(99,102,241,0.07)" }}
              >
                <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-0.5 text-xs font-bold text-white shadow-lg">
                  {t("pricing.pro.badge")}
                </div>
                <h3 className="text-xl font-bold text-white">{t("pricing.pro.name")}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{t("pricing.pro.price")}</span>
                  <span className="text-white/40">{t("pricing.pro.period")}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {(t.raw("pricing.pro.features") as string[]).map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                      <CheckCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/register"
                  className="btn-procon mt-8 block w-full rounded-xl py-3 text-center text-sm font-semibold"
                >
                  {t("pricing.pro.cta")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 px-6 py-8 border-t"
        style={{ background: "var(--surface-topbar)", borderColor: "var(--panel-border)" }}
      >
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs">PC</div>
            <span className="text-sm font-semibold text-white/60">ProCon</span>
          </div>
          <p className="text-sm text-white/25">
            &copy; {new Date().getFullYear()} WAMOCON GmbH. {t("footer.rights")}
          </p>
          <nav className="flex gap-5 text-sm text-white/35">
            <Link href="/legal/impressum" className="hover:text-white/70 transition-colors">{t("footer.impressum")}</Link>
            <Link href="/legal/datenschutz" className="hover:text-white/70 transition-colors">{t("footer.datenschutz")}</Link>
            <Link href="/legal/agb" className="hover:text-white/70 transition-colors">{t("footer.agb")}</Link>
          </nav>
        </div>
      </footer>

      <GdprBanner />
    </div>
  );
}
