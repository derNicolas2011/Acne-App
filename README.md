# Skin Tracker

Persönliche Web-App zum Tracking von Hautbild, Skincare, Medikamenten und Ernährung.
Mobile-First, ausgelegt auf einen einzelnen Nutzer — die Datenstruktur ist
mehrbenutzerfähig vorbereitet.

## Stack

| Bereich | Technologie |
| --- | --- |
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| UI | Tailwind CSS v4, eigenes Design-System in `src/app/globals.css` |
| Datenbank | Supabase Postgres via Drizzle ORM |
| Storage | Supabase Storage, private Buckets + signierte URLs |
| Auth | Auth.js (NextAuth v5), Credentials, JWT-Session |
| KI | Vercel AI SDK mit Google Gemini |

## Einrichtung

```bash
npm install
cp .env.local.example .env.local   # Werte eintragen
npm run dev
```

Benötigte Supabase-Buckets (beide **privat**): `skin-photos`, `meal-photos`.

Schema in die Datenbank bringen:

```bash
npx drizzle-kit push
```

Die `users`-Zeile für das konfigurierte Konto wird bei der ersten
erfolgreichen Anmeldung automatisch angelegt.

## Architektur

```
src/
  app/
    (app)/        Angemeldeter Bereich; das Layout erzwingt die Session
    api/          Upload, Analyse, Datenexport
    login/
  components/
    shared/       Design-System-Bausteine (Surface, PageHeader, States …)
    dashboard/ skin/ nutrition/ treatment/ timeline/ analysis/ settings/
  lib/
    ai/           Prompts und typisierte Modellaufrufe
    db/           Drizzle-Schema und Verbindung
    queries/      Lesezugriffe, immer auf eine userId eingeschränkt
    date.ts       Alle Tagesgrenzen in Europe/Zurich
    routine.ts    Häufigkeits- und Compliance-Regeln
    score.ts      Deutung des Skin Scores (höher = besser)
    insights.ts   Langzeitvergleiche über die eigenen Daten
```

### Sicherheit

- `src/proxy.ts` ist nur ein günstiges UX-Gate (Cookie vorhanden?).
  Die eigentliche Prüfung sind `requireUser()` / `requireUserId()` in jeder
  Page, Server Action und Route.
- Jede Query ist auf die `userId` der Session eingeschränkt.
- Bilder liegen in privaten Buckets; Zugriff nur über signierte URLs mit
  kurzer Gültigkeit. Es gibt keine öffentlichen Bild-URLs.
- `src/lib/supabase/client.ts` enthält bewusst nur den Server-Client,
  damit der Service-Role-Key nicht ins Browser-Bundle geraten kann.

### Umgang mit KI-Ausgaben

- Analysen betreffen ausschliesslich Hautmerkmale, nie das Aussehen.
- Ergebnisse werden als Beobachtung dargestellt, nie als Diagnose.
- Die Langzeitauswertung vergleicht Tagesgruppen und benennt
  Stichprobengrössen; sie behauptet keine Ursachen.
- Reicht die Datenmenge nicht, wird das ausgewiesen statt geschätzt.

## Deployment (Vercel)

Alle Variablen aus `.env.local.example` im Projekt hinterlegen.
`AUTH_SECRET` muss in Produktion gesetzt sein. Secrets stehen
ausschliesslich serverseitig; im Client liegen nur `NEXT_PUBLIC_*`-Werte.
