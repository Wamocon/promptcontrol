import Link from "next/link";

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-2xl prose dark:prose-invert">
        <Link href="/" className="text-sm text-indigo-600 hover:underline mb-8 block">&larr; Zurück</Link>
        <h1>Impressum</h1>
        <p><strong>Stand: Mai 2026</strong></p>

        <h2>WAMOCON GmbH</h2>
        <p>
          Mergenthalerallee 79 - 81<br />
          65760 Eschborn<br />
          Deutschland
        </p>

        <h2>Kontakt</h2>
        <p>
          Telefon: +49 6196 5838311<br />
          E-Mail: info@wamocon.com<br />
          Projektkontakt: procon@wamocon.com
        </p>

        <h2>Vertretungsberechtigter Geschäftsführer</h2>
        <p>Dipl.-Ing. Waleri Moretz</p>

        <h2>Registereintrag</h2>
        <p>
          Sitz der Gesellschaft: Eschborn<br />
          Handelsregister: Eschborn HRB 123666<br />
          Umsatzsteuer-Identifikationsnummer: DE344930486
        </p>

        <h2>Angaben zum Angebot</h2>
        <p>
          ProCon (PromptControl) ist eine webbasierte Software-as-a-Service-Plattform
          für die zentrale Verwaltung, Versionierung und Optimierung von KI-Prompts.
          Das Angebot richtet sich primär an Unternehmen und gewerbliche Nutzer.
        </p>

        <h2>Haftungsausschluss</h2>
        <p>
          Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die
          Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich
          deren Betreiber verantwortlich.
        </p>
      </div>
    </div>
  );
}
