# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt

Belegungsplan für den Gemeinschaftsraum eines Studentenwohnheims (deutschsprachiges UI, „du"-Ton).
Hobby-/Community-Tool, bewusst KEIN Startup-Projekt: kein SEO, keine Analytics, kein Marketing.
Betrieb: ein einzelner Node-Prozess mit SQLite-Datei, gehostet von einem Mitbewohner —
minimale Betriebskosten sind eine harte Anforderung (keine externen Dienste, keine Managed-DB).
`PROGRESS.md` hält den Projektstand und Gotchas aktuell — bei Sessionbeginn lesen, bei
größeren Änderungen fortschreiben.

## Befehle

```bash
npm run dev                                  # Dev-Server (braucht .env, siehe .env.example)
npm run test:unit -- --run                   # alle Vitest-Unit-Tests
npx vitest run src/lib/server/bookings.test.ts   # einzelne Testdatei
npx playwright test                          # E2E (baut Prod-Build, startet Preview selbst)
npx playwright test --project=desktop -g "Ablauf"  # einzelner E2E-Test
npm run lint                                 # Prettier-Check + ESLint
npm run check                                # svelte-check (Typen)
npm run build && node build                  # Produktionsstart wie beim Hoster
npm run db:generate                          # Drizzle-Migration nach Schema-Änderung erzeugen
```

CI (GitHub Actions): lint → check → unit → build plus E2E-Job; muss vor Merge grün sein.

## Architektur

SvelteKit (Svelte 5 Runes, TypeScript, `adapter-node`) + SQLite via Drizzle/`better-sqlite3`
(synchrones API, keine async-DB-Calls). Formulare als SvelteKit Form Actions mit Progressive
Enhancement — alles funktioniert ohne JS, `use:enhance` ist nur Zucker.

Zentrale Bausteine und ihr Zusammenspiel:

- `src/hooks.server.ts` — Startpunkt: validiert ENV (`env.ts`), öffnet DB + führt Migrationen
  aus (`db/index.ts` → `db/create-db.ts`, Migrationsordner `drizzle/`), startet Cleanup-Job
  (löscht Einträge 30 Tage nach Ende) und Limiter-Pruning. Danach: Auth-Guard — alles außer
  `PUBLIC_PATHS` (`/login`, `/healthz`, `/datenschutz`, `/kalender.ics`) verlangt das
  Session-Cookie; setzt außerdem Security-Header. CSP liegt in `vite.config.ts`
  (Kit-Option `csp`, nonce-basiert; es gibt KEIN `svelte.config.js` — Kit-Optionen stehen
  inline im `sveltekit()`-Plugin-Aufruf).
- **Zeitmodell** (`src/lib/time.ts`): DB speichert Unix-ms (UTC); alle Eingabe/Anzeige läuft
  über Europe-Berlin-Helfer (date-fns + `@date-fns/tz`). Buchung über Mitternacht = ein
  Eintrag, dessen Ende am Folgetag liegt (`computeRange`: Ende ≤ Start ⇒ +1 Tag).
- **Validierung** (`src/lib/validation/booking.ts`): eine Funktion `validateBookingForm` für
  Erstellen UND Bearbeiten; Zod für Form/Längen, danach Zeitregeln (max. 92 Tage voraus,
  max. 12 h, 15 min Vergangenheits-Kulanz). Deutsche, feldbezogene Fehlermeldungen.
- **Repository** (`src/lib/server/bookings.ts`): Überlappungsprüfung + Insert/Update laufen
  in EINER Transaktion (`findConflict` mit `startsAt < end AND endsAt > start`); angrenzende
  Zeiten kollidieren nicht. Konfliktergebnis enthält den störenden Eintrag für die Meldung.
- **Auth ohne Accounts**: ein Haus-Passwort (ENV) → HMAC-signiertes Cookie `expiry.sig`
  (`session.ts`, 180 Tage). Einträge gehören niemandem — Bearbeiten/Löschen nur über
  Edit-Token in der URL (32 Byte base64url, DB speichert nur SHA-256-Hash, `tokens.ts`).
  Der ICS-Feed-Token ist deterministisch aus `SESSION_SECRET` abgeleitet (`ics.ts`).
- **UI-Fluss**: Startseite `/` = Monatskalender (`?tag=YYYY-MM-DD` wählt Tag und Monat)
  mit Tages-Panel darunter. Eintragen läuft über `BookingDialog.svelte` (natives
  `<dialog>`, im Layout gemountet, per Svelte-Context `booking-dialog` geöffnet; Klick
  auf freien Tag öffnet ihn direkt mit Datum). Der Dialog postet an die Action von
  `/neu` — diese Seite ist zugleich der No-JS-Fallback. Dialog-Inhalt wird nur bei
  geöffnetem Dialog gerendert (sonst doppelte Feld-IDs mit `/neu`).
- **Datensparsamkeit ist Design-Regel**: `+page.server.ts`-Loads geben nie `editTokenHash`
  oder unnötige Felder an den Client (Übersicht: kein Kontakt/Zimmer — erst die
  Detailseite zeigt Kontakt); der ICS-Feed enthält nur Titel + Zeiten.

## Konventionen & Fallstricke

- Design-Tokens in `src/styles/tokens.css` (oklch, hell + dunkel via
  `prefers-color-scheme`); Komponenten-Styles in den `.svelte`-Dateien. Fonts self-hosted
  über `@fontsource-variable/*/index.css`-Importe im Layout (der `/index.css`-Suffix ist
  nötig, sonst meckert svelte-check). Keine externen CDNs/Fonts — CSP ist `self`-only.
- Kontraste müssen WCAG AA halten — die E2E-Suite enthält axe-Checks, die bei
  Farb-Änderungen brechen. Belegt/frei nie nur über Farbe unterscheiden.
- E2E: Tests laufen seriell (gemeinsame DB + Login-Rate-Limit). Ein Setup-Projekt loggt
  einmal ein und teilt `storageState`; Tests ohne Anmeldung müssen explizit
  `storageState: { cookies: [], origins: [] }` setzen (auch bei `browser.newContext()` —
  das erbt die `use`-Optionen!). Vor Formular-Eingaben `body[data-hydrated]` abwarten,
  sonst setzt die Svelte-Hydration getippte Werte zurück.
- Lokales Dev-Testen des Logins: In-Memory-Rate-Limit (10/15 min) — Dev-Server-Neustart
  setzt es zurück.
- ENV heißt `DATABASE_PATH` (nicht `DATABASE_URL`); hinter Reverse Proxy ist `ORIGIN`
  Pflicht (CSRF). Alle ENV-Variablen: `.env.example`.
- TDD ist hier etabliert: Server-Logik zuerst per Vitest (rot → grün), UI-Flows per
  Playwright. Neue Migrationen nur via `npm run db:generate` (Migrationen laufen beim
  App-Start automatisch, der Hoster führt nie drizzle-kit aus).
