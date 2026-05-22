import Link from "next/link";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-2xl prose dark:prose-invert">
        <Link href="/" className="text-sm text-indigo-600 hover:underline mb-8 block">&larr; Zurück</Link>
        <h1>Datenschutzerklärung</h1>
        <p><strong>Stand: Mai 2026</strong></p>

        <h2>1. Verantwortlicher</h2>
        <p>
          WAMOCON GmbH<br />
          Mergenthalerallee 79-81, 65760 Eschborn<br />
          E-Mail: datenschutz@wamocon.com
        </p>

        <h2>2. Erhobene Daten</h2>
        <p>
          Beim Betrieb von ProCon erheben wir folgende personenbezogene Daten:
        </p>
        <ul>
          <li>Registrierungsdaten (Name, E-Mail-Adresse)</li>
          <li>Nutzungsdaten (API-Aufrufe, Log-Einträge)</li>
          <li>Technische Daten (IP-Adresse, Browser-Informationen)</li>
        </ul>

        <h2>3. Zweck der Verarbeitung</h2>
        <p>
          Die Verarbeitung Ihrer Daten erfolgt zur Bereitstellung der SaaS-Plattform,
          zur Authentifizierung und zur Analyse der Systemnutzung (Logging).
        </p>

        <h2>4. Rechtsgrundlage</h2>
        <p>
          Die Verarbeitung basiert auf Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
          sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen).
        </p>

        <h2>5. Datenspeicherung</h2>
        <p>
          Ihre Daten werden auf Servern von Supabase (EU-Region) gespeichert.
          Die Datenverarbeitung erfolgt DSGVO-konform.
        </p>

        <h2>6. Ihre Rechte</h2>
        <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Widerspruch.
          Kontaktieren Sie uns unter datenschutz@wamocon.com.</p>

        <h2>7. Cookies</h2>
        <p>
          Wir verwenden ausschließlich technisch notwendige Cookies für den Betrieb
          der Plattform (Authentifizierungs-Session). Es werden keine Marketing-Cookies eingesetzt.
        </p>
      </div>
    </div>
  );
}
