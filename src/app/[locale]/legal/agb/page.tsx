import Link from "next/link";

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-2xl prose dark:prose-invert">
        <Link href="/" className="text-sm text-indigo-600 hover:underline mb-8 block">&larr; Zurück</Link>
        <h1>Allgemeine Gesch&auml;ftsbedingungen (AGB)</h1>
        <p><strong>Stand: Mai 2026</strong></p>

        <h2>1. Geltungsbereich</h2>
        <p>
          Diese AGB gelten für alle Verträge zwischen der WAMOCON GmbH
          (nachfolgend &bdquo;Anbieter&ldquo;) und ihren Kunden über die Nutzung der
          SaaS-Plattform ProCon (PromptControl).
        </p>

        <h2>2. Leistungsbeschreibung</h2>
        <p>
          ProCon ist eine webbasierte Plattform zur Verwaltung, Versionierung
          und Auslieferung von KI-Prompts via REST-API. Der Anbieter stellt
          die Plattform mit einer Verfügbarkeit von 99,5% p.a. bereit.
        </p>

        <h2>3. Vertragsschluss</h2>
        <p>
          Der Vertrag kommt mit der Registrierung und der Bestätigung durch
          den Anbieter zustande. Mit der Registrierung akzeptiert der Nutzer
          diese AGB und die Datenschutzerklärung.
        </p>

        <h2>4. Preise und Zahlung</h2>
        <p>
          Free Plan: Kostenlos, begrenzte Funktionen.<br />
          Pro Plan: 20,00 EUR pro Seat pro Monat, zzgl. gesetzlicher MwSt.<br />
          Zahlungen erfolgen monatlich per Stripe.
        </p>

        <h2>5. Datenschutz</h2>
        <p>
          Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer
          Datenschutzerklärung und der DSGVO.
        </p>

        <h2>6. Haftungsbeschränkung</h2>
        <p>
          Der Anbieter haftet nicht für Schäden, die durch unsachgemäße Nutzung
          oder durch Ausfälle von Drittanbietern entstehen.
        </p>

        <h2>7. Kündigung</h2>
        <p>
          Der Pro Plan kann monatlich zum Ende des Abrechnungszeitraums gekündigt
          werden. Der Free Plan kann jederzeit ohne Frist beendet werden.
        </p>

        <h2>8. Anwendbares Recht</h2>
        <p>
          Es gilt deutsches Recht. Gerichtsstand ist Eschborn.
        </p>

        <hr />
        <p className="text-sm text-zinc-500">
          WAMOCON GmbH - Mergenthalerallee 79-81 - 65760 Eschborn<br />
          HRB 123666 - USt-IdNr.: DE344930486
        </p>
      </div>
    </div>
  );
}
