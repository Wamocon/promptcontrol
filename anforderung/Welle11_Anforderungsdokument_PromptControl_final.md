**Anforderungsdokument**

ProCon - Softwareprojekt

  -----------------------------------------------------------------------
  **Welle**              11
  ---------------------- ------------------------------------------------
  **Projekt:**           ProCon

  **Unternehmen**        WAMOCON GmbH

  **App Version:**       1

  **Erstellt von:**      Nikolaj Schefner

  **Eingereicht an:**    Waleri Moretz (Geschäftsführung)

  **Datum:**             19.04.2026

  **Vertraulichkeit:**   Intern vertraulich

  **Status:**            Zur Freigabe eingereicht
  -----------------------------------------------------------------------

# **1. Zusammenfassung**

## **1.1 Die Idee**

**ProCon** oder PromptControl ist eine spezialisierte und
hochskalierbare Management-Schicht für das gesamte Unternehmen zur
effizienten Verwaltung, Versionierung und Optimierung von KI-Prompts für
große Sprachmodelle (LLMs[^1]).

Die Applikation entkoppelt Code-Logik und KI-Prompts radikal:

-   Statt Systemanweisungen versteckt im Quellcode ("hardcoded") zu
    pflegen, verlagert **ProCon** diese in ein zentrales, visuelles
    Dashboard mit intuitiver Bedienung.

Dadurch wird das Unternehmenswissen rund um künstliche Intelligenz
zugänglich gemacht.

-   Nicht nur Entwickler und Produktmanager (PMs) profitieren davon.

-   Auch Fachexperten aus Fachabteilungen, neue Mitarbeiter im
    Onboarding, Auszubildende oder Praktikanten können sofort auf einen
    standardisierten, qualitativ hochwertigen Katalog von
    Best-Practice-Prompts zugreifen, diese anwenden oder ohne
    Code-Eingriffe modifizieren.

Neben der klassischen Copy-&-Paste-Methode ermöglicht die Lösung eine
vollautomatisierte Nutzung direkt aus der IDE oder der
GitHub-Oberfläche, wie beispielsweise über Model Context Protocol / MCP.
Das sorgt dafür, dass Prompts nahtlos im Entwicklungs-Workflow landen.

Eine weitere zentrale Kernfunktion ist zudem der automatisierte Export:

-   Das Tool bietet Fachabteilungen und Entwicklern die Möglichkeit, im
    Editor angelegte Prompts mit nur einem Klick als perfekt formatierte
    instruction.md- oder skill.md-Eingabedateien zu exportieren,
    optimal, um ohne manuellen Markdown-Aufwand individuelle KI-Agenten
    oder Copilot-Skills auszustatten.

## **1.2 Warum jetzt?**

Der Markt geht von der KI-Experimentierphase in den produktiven
Enterprise-Betrieb über. Fehlende Testbarkeit, "zerbrochene" Apps bei
Modell-Updates und ineffizientes Prompt-Wissen, das auf einzelne Köpfe
verteilt ist, verursachen hohe Kosten.

Eine professionelle, entkoppelte Infrastruktur für Prompt-Management,
die das Unternehmenswissen zentralisiert und für alle Erfahrungsstufen
vom Azubi bis zum Senior Developer nutzbar macht, ist nun eine
geschäftskritische Notwendigkeit.

# **2. Marktanalyse**

  ----------------------------------------------------------------------------------
  Fakt / Segment          Beschreibung / Interpretation    Quelle
  ----------------------- -------------------------------- -------------------------
  Wachsender Markt für    In Europa zwingen strikte        *Bitkom,
  KI-Dev-Tools            Compliance-Vorgaben Unternehmen  Enterprise-KI-Wachstum,
                          dazu, den Einsatz von            2025*
                          KI-Modellen detailliert zu       
                          steuern und zu versionieren.     

  Ineffizienzen bei       Die Praxis, Prompts "hardcoded"  *Gartner, AI Engineering
  Hardcoding              in Git-Repositories[^2] zu       Practices Report, 2025*
                          speichern, kostet Teams          
                          wöchentlich signifikante         
                          Arbeitszeit bei Updates.         

  Hoher Bedarf im         Jedes Softwarehaus in            *IfM Bonn,
  Mittelstand             Deutschland, das KI-Dienste      Digitalisierung
                          betreibt, braucht eine           Mittelstand, 2025*
                          DSGVO[^3]-konforme Lösung für    
                          "Non-Tech"-Kontrolle und         
                          Wissensweitergabe.               
  ----------------------------------------------------------------------------------

# **3. Wettbewerb**

## **3.1 Konkurrenzüberblick**

  ----------------------------------------------------------------------------
  Anbieter          Typ               Eigenschaften        Wettbewerbsstärke
  ----------------- ----------------- -------------------- -------------------
  Langfuse          Vollprodukt       Komplexe Metriken,   Stark
                    (USA/UK)          Tracing, SaaS & Open 
                                      Source. Fokus        
                                      Angloamerikanisch.   

  Promptlayer       Speziallösung     Proxy-basiertes      Mittel
                    (USA)             Logging, stark an    
                                      OpenAI gebunden,     
                                      technisch für PMs.   

  Eigene Git-Lösung Status Quo        Keine direkten       Schwach
                                      Kosten,              
                                      wartungsintensiv,    
                                      keine                
                                      PM-Nutzbarkeit.      
  ----------------------------------------------------------------------------

## **3.3 Marktlücke als Schlussfolgerung**

Es fehlt eine klar auf den europäischen (DSGVO-sensiblen) Markt
zugeschnittene Lösung, die eine intuitive Dashboard-Bedienung für das
ganze Team bietet, provider-agnostisch funktioniert und Prompts direkt
in den Workflow integriert wie per IDE-Anbindung.

# **4. Zielgruppe**

+----------------------+-----------------------+-----------------------+
| Zielgruppe           | Profil / Beschreibung | Marktvolumen          |
+======================+=======================+=======================+
| B2B: Entwickler &    | Leiden unter          | ca. 45.000            |
| DevOps (Primär)      | repetitiven           | IT-Unternehmen in DE  |
|                      | Prompt-Anpassungen im |                       |
|                      | Code.                 |                       |
|                      |                       |                       |
|                      | Suchen Tools zur      |                       |
|                      | Entlastung.           |                       |
+----------------------+-----------------------+-----------------------+
| B2B: Produktmanager  | Möchten Verhalten der | ca. 120.000 PMs im    |
| (PMs) (Primär)       | KI in Echtzeit        | Software-Sektor DE    |
|                      | steuern und A/B-Tests |                       |
|                      | durchführen, ohne     |                       |
|                      | Entwickler zu         |                       |
|                      | blockieren.           |                       |
+----------------------+-----------------------+-----------------------+
| B2B: Neue            | Benötigen zentralen,  | Hunderttausende       |
| Mitarbeiter, Azubis, | einfachen Zugang zu   | Angestellte im        |
| Praktikanten         | standardisierten,     | Onboarding            |
| (Primär)             | firmenspezifischen    |                       |
|                      | Prompts für ihre      |                       |
|                      | tägliche Arbeit.      |                       |
+----------------------+-----------------------+-----------------------+
| Agenturen (Sekundär) | Bauen KI-Chatbots für | ca. 5.000 reine       |
|                      | externe Kunden und    | Digitalagenturen      |
|                      | benötigen eine        |                       |
|                      | zentrale Instanz für  |                       |
|                      | alle Projekte.        |                       |
+----------------------+-----------------------+-----------------------+

# **5. Nutzen** {#nutzen-1}

  -----------------------------------------------------------------------
  Akteur                  Echter Nutzen           Metriken / Beispiele
  ----------------------- ----------------------- -----------------------
  Entwicklungsteams       Massive                 Einsparung von ca. 5-10
                          Ressourcenersparnis.    Stunden Entwicklerzeit
                          Prompts müssen nicht    pro Woche.
                          mehr durch die reguläre 
                          CI/CD[^4]-Pipeline      
                          deployt werden.         

  Neue Mitarbeiter &      Schnellerer             Reduzierung der
  Fachexperten            Produktivitätsstart     Einarbeitungszeit beim
                          durch sofortigen        KI-Einsatz.
                          Zugriff auf die besten  
                          Unternehmens-Prompts im 
                          Arbeitsalltag.          

  Unternehmen (Käufer)    Transparente Token- und Senkung der API-Kosten
                          Latenzkosten. Bessere   um 20-30% durch
                          ROI[^5]-Planung durch   optimiertes
                          A/B-Tests.              Prompt-Routing.
  -----------------------------------------------------------------------

# **6. Abhängigkeiten und Herausforderungen**

+----------------------+-----------------------+-----------------------+
| Abhängigkeit /       | Beschreibung          | Echte Gegenmaßnahme   |
| Herausforderung      |                       |                       |
+======================+=======================+=======================+
| API-Latenz der       | **ProCon** darf den   | Caching-Systeme und   |
| Middleware           | LLM-Aufruf der        | CDN[^6]-nahe          |
|                      | Zielapplikation nicht | Auslieferung          |
|                      | spürbar verzögern.    | implementieren        |
|                      |                       | (Prompts werden am    |
|                      |                       | Edge gehalten).       |
+----------------------+-----------------------+-----------------------+
| Integration in den   | Entwickler wollen     | Bereitstellung eines  |
| Entwickler-Workflow  | Prompts nicht mühsam  | MCP-Servers und       |
|                      | per Copy-Paste aus    | VS-Code IDE-Anbindung |
|                      | Webseiten kopieren.   | für direkten Abruf    |
|                      |                       | via GitHub Copilot.   |
+----------------------+-----------------------+-----------------------+
| Datenschutz (DSGVO)  | Echtdaten (PII) oder  | Es wird ein manuell   |
| und Compliance       | Compliance-kritische  | per Button in der UI  |
|                      | Anweisungen könnten   | bedienbarer           |
|                      | versehentlich im      | Datenschutz- und      |
|                      | Prompt-Katalog        | Compliance-Scanner in |
|                      | landen.               | den Editor eingebaut. |
|                      |                       |                       |
|                      |                       | Dieser prüft erst auf |
|                      |                       | Klick und warnt dann  |
|                      |                       | vor kritischen        |
|                      |                       | Inhalten (z. B. PII). |
+----------------------+-----------------------+-----------------------+

# **7. Businessmodell**

  -----------------------------------------------------------------------
  Plan     Umfang                                       Preis / Modell
  -------- -------------------------------------------- -----------------
  Free     1 Projekt, max. 5 Nutzer (Seats), max. 10    0,00 €
  Plan     Prompts hinterlegbar, einfache               
           Versionierung, 14 Tage Log-Retention.        

  Pro Plan Unbegrenzte Projekte, A/B-Testing,           20,00 € / Seat
           unbegrenzte Log-Retention, Teamverwaltung,   pro Monat
           IDE-Integration.                             
  -----------------------------------------------------------------------

Empfehlung: Wir starten mit dem Seat-basierten Freemium-SaaS-Modell, um
eine hohe initiale Verbreitung (Free) zu garantieren und erweiterte
Integrationen im Pro-Plan abzurechnen.

# **8. Anforderungen Version 1**

### Hauptprozesse

  ----------------------------------------------------------------------------
  ID     Anforderung                                               Priorität
  ------ --------------------------------------------------------- -----------
  P-01   Verwaltung von "Projekten" und firmeninternen             Muss
         Prompt-Katalogen zur Abtrennung von Bereichen.            

  P-02   Visueller Editor zum Erstellen und Bearbeiten von         Muss
         System-Prompts für alle Mitarbeiter.                      

  P-03   Logik für Prompt-Versionierung inkl. Rollback Option.     Muss

  P-04   Schnelle REST-API[^7] zum Abruf der Prompts für           Muss
         interne/externe Apps.                                     

  P-05   Export-Funktion: Direkter Export von Prompts als          Muss
         vorkonfigurierte instruction.md oder skill.md Dateien für 
         KI-Agenten.                                               

  P-06   IDE / Copilot-Integration: Bereitstellung eines Model     Muss
         Context Protocol (MCP) Servers zur direkten               
         Prompt-Abfrage aus GitHub Copilot oder anderen IDE-Chats. 

  P-07   Logging-Modul (Latenz und Token-Kosten).                  Muss

  P-08   A/B-Testing Funktion (Verhältnisbasiertes Ausspielen von  Soll
         2 Prompts).                                               

  P-09   Themenspezifische Gruppierung und Filterung von Prompts   Muss
         zur besseren Auffindbarkeit (z.B. HR, Marketing,          
         Code-Richtlinien).                                        

  P-10   Datenschutz- und Compliance-Scanner im Editor. Diese      Muss
         Funktion kann per Button-Klick in der UI manuell vom      
         Nutzer getriggert werden und warnt vor kritischen         
         Vorgaben.                                                 

  P-11   Integrierte KI-Analyse. Ein Button im Chat triggert eine  Muss
         KI, die den Prompt nach bestimmten Kriterien bewertet und 
         einen Handlungsbericht als Empfehlung erstellt. Der       
         KI-Chat steht für Rückfragen jederzeit als UI-Hilfe       
         bereit. Jeder Bericht muss zwingend den Disclaimer        
         "KI-generierte Analyse" sichtbar enthalten.               
  ----------------------------------------------------------------------------

### Basisprozesse

  ----------------------------------------------------------------------------
  ID     Anforderung                                               Priorität
  ------ --------------------------------------------------------- -----------
  B-01   Registrierung (E-Mail/Passwort) und Profileinstellungen.  Muss

  B-02   Rollen & Rechte (Admin, PM, Developer, Azubi/Trainee).    Muss

  B-03   Admin-Dashboard für Teameinladungen.                      Muss

  B-04   DSGVO-Banner, Impressum, AGB, Datenschutzerklärung.       Muss
  ----------------------------------------------------------------------------

### Businessmodell

  ----------------------------------------------------------------------------
  ID     Anforderung                                               Priorität
  ------ --------------------------------------------------------- -----------
  M-01   Paywall-Sperre für Pro-Features (A/B Testing,             Muss
         IDE-Integration).                                         

  M-02   Stripe-Integration zur Zahlungsabwicklung des Pro-Plans.  Muss
  ----------------------------------------------------------------------------

# **9. Chancen und Risiken**

## **9.1 Chancen**

  -----------------------------------------------------------------------
  Chance                              Begründung
  ----------------------------------- -----------------------------------
  Starker Lock-in Effekt              B2B-Kunden wechseln essenzielle
                                      Infrastrukturkomponenten selten,
                                      was wiederkehrende Umsätze sichert.

  Deutscher Marktstandard             Die Positionierung als europäische,
                                      DSGVO-sichere Alternative zu
                                      US-Produkten trifft einen Nerv.
  -----------------------------------------------------------------------

## **9.2 Risiken**

  --------------------------------------------------------------------------------------
  Risiko         Eintrittswahrscheinlichkeit   Auswirkung   Echte Gegenmaßnahme
  -------------- ----------------------------- ------------ ----------------------------
  LLM-Anbieter   Mittel                        Hoch         Strikt "Provider-agnostisch"
  integrieren                                               bauen, sodass Kunden mit
  Tools selbst                                              unserer App jederzeit von
                                                            OpenAI zu Anthropic wechseln
                                                            können.

  Open-Source    Hoch                          Mittel       Extrem intuitives
  Konkurrenz                                                UI/UX-Design speziell für
  wird zu                                                   den Nicht-Entwickler sowie
  dominant                                                  direkte IDE-Integrationen
                                                            (VS Code/Copilot)
                                                            priorisieren.
  --------------------------------------------------------------------------------------

# **10. Umsetzungsplan**

## **10.1 Technologie Stack**

  -----------------------------------------------------------------------
  Schicht                 Technologie             Empfehlung aus
                                                  Internetrecherche
  ----------------------- ----------------------- -----------------------
  Frontend                Next.js (React)         Ideal für schnelle,
                                                  SEO-freundliche
                                                  SaaS-Dashboards mit
                                                  React Server
                                                  Components.

  Backend & API           Node.js / Edge Funktion Edge-Funktion (z.B.
                                                  Cloudflare) reduzieren
                                                  Latenz für API-Aufrufe
                                                  massiv.

  Datenbank               PostgreSQL (Supabase)   Bewährte relationale
                                                  Datenbank mit
                                                  integrierter
                                                  Authentifizierung und
                                                  Row-Level-Security.

  IDE-Integration         Model Context Protocol  Bester Standard, um von
                          (MCP)                   ChatGTP/Copilot direkt
                                                  auf die Firmen-Prompts
                                                  per API zuzugreifen.
  -----------------------------------------------------------------------

## **10.2 Umsetzungsplan**

*Hinweis: Der Umsetzungsplan basiert auf 5 Werktagen + 1 Tag Puffer.
GitHub Copilot übernimmt den Großteil des Codings, der Entwickler führt
Code-Reviews durch.*

  --------------------------------------------------------------------------
  Phase             Zeitraum          Fokus             Inhalt
  ----------------- ----------------- ----------------- --------------------
  Phase 1           Montag            Setup & Basis     Repo-Setup,
                                                        DB-Design,
                                                        Authentifizierung,
                                                        Rollen (B-01 bis
                                                        B-04).

  Phase 2           Dienstag          Prompt-Katalog    Frontend &
                                                        CRUD-Logik für
                                                        Projekte,
                                                        themenspezifische
                                                        Gruppierung,
                                                        Prompt-Editor und
                                                        .skill.md Export
                                                        (P-01, P-02, P-05,
                                                        P-09).

  Phase 3           Mittwoch          API & Routing     Bau der agnostischen
                                                        REST-API zur
                                                        Auslieferung an
                                                        Kunden-Apps &
                                                        Versionierung (P-03,
                                                        P-04).

  Phase 4           Donnerstag        IDE-Integration   Bereitstellung des
                                                        MCP-Endpunkts, damit
                                                        GitHub Copilot
                                                        direkt Prompts lesen
                                                        kann (P-06).

  Phase 5           Freitag           Payment &         Logging-Service
                                      Compliance        aufbauen (P-07),
                                                        automatisierten
                                                        Compliance-Scanner
                                                        integrieren (P-10)
                                                        sowie Stripe Auth
                                                        einbinden (M-01,
                                                        M-02).

  Puffer            Samstag           Testing & Review  Edge-Cases,
                                                        Bugfixing,
                                                        Latenzoptimierung.
                                                        Finaler Review.
  --------------------------------------------------------------------------

# **Quellenverzeichnis**

  -----------------------------------------------------------------------
  Quelle                              Inhalt
  ----------------------------------- -----------------------------------
  Bitkom, Enterprise-KI-Wachstum,     Analyse des KI-Marktes in deutschen
  2025                                Unternehmen.

  IfM Bonn, Digitalisierung           Herausforderungen beim Thema DSGVO
  Mittelstand, 2025                   und IT im Mittelstand.

  Gartner, IT-Effizienz-Report, 2024  Bericht über Zeitverlust durch
                                      Entwickler bei manuellem
                                      Code-Maintenance.
  -----------------------------------------------------------------------

*Erstellt: 19.05.2026 \| WAMOCON GmbH \| Intern vertraulich \|
Anforderungsdokument ProCon*

[^1]: LLM (Large Language Model): Ein probabilistisches, tiefes
    neuronales Netz, das darauf trainiert ist, menschliche Sprache zu
    verstehen und zu generieren.

[^2]: Git-Repository: Ein Verzeichnis zur Versionsverwaltung von
    Programmcode bei der Softwareentwicklung.

[^3]: DSGVO (Datenschutz-Grundverordnung): EU-Verordnung für Regeln zur
    Verarbeitung personenbezogener Daten.

[^4]: CI/CD (Continuous Integration / Continuous Deployment):
    Automatisiertes Testen und Bereitstellen von Software-Änderungen.

[^5]: ROI (Return on Investment): Betriebswirtschaftliche Kennzahl für
    die Rentabilität einer Investition.

[^6]: CDN (Content Delivery Network): Ein globales Server-Netzwerk zur
    Reduzierung der Antwortzeiten.

[^7]: REST-API: Eine standardisierte Schnittstelle zur Kommunikation
    verschiedener Softwaresysteme.
