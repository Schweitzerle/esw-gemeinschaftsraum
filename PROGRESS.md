# PROGRESS

Belegungsplan für den Gemeinschaftsraum (Studentenwohnheim Regensburg).
Anforderungen: siehe lokale `PROMPT.md` (nicht im Repo) bzw. README.

## Entscheidungen

- Buchungsregeln: max. 3 Monate (92 Tage) im Voraus, max. 12 h Dauer, nicht in der Vergangenheit (15 min Kulanz); über Mitternacht = ein Eintrag mit Ende am Folgetag.
- Kontaktnummer erst in der Detailansicht `/eintrag/[id]`, nicht in der Übersicht.
- ENV: `HAUS_PASSWORT`, `SESSION_SECRET`, `DATABASE_PATH`, `ORIGIN`, `PORT` — Validierung beim Start (`src/lib/server/env.ts`).
- Zeiten als Unix-ms (UTC) in SQLite, Anzeige Europe/Berlin (date-fns + @date-fns/tz).
- Edit-Token: 32 Byte base64url in URL, SHA-256-Hash in DB (`src/lib/server/tokens.ts`).
- Session: HMAC-signierter Cookie-Wert `expiry.sig`, 180 Tage, httpOnly+secure (`src/lib/server/session.ts`).
- Rate-Limits in-memory: Login 10/15 min, Schreiben 30/min (`src/lib/server/limiters.ts`).
- CSP über Kit-Option in `vite.config.ts` (nonce-basiert), übrige Header in `hooks.server.ts`.
- Design: warm/wohnheimig, Fraunces + Nunito Sans (self-hosted via @fontsource), oklch-Tokens in `src/styles/tokens.css`, hell + dunkel.
- Kein Startup Mode (Hobby-Projekt): kein SEO, keine Analytics, kein Marketing.

## Stand (MVP fertig und verifiziert)

- [x] Scaffold, Git, GitHub (https://github.com/Schweitzerle/esw-gemeinschaftsraum), CI
- [x] Datenmodell + Server-Logik (TDD, 44 Unit-Tests, Coverage > 90 % der Server-Logik)
- [x] Passwort-Gate + Security-Header + Rate-Limiting
- [x] Design-Tokens + Wochenansicht (mobile-first, hell/dunkel)
- [x] Eintrag erstellen + Konfliktmeldung + Erfolgsseite mit Edit-Link + Detailansicht
- [x] Bearbeiten/Löschen per Token-Link (403 bei falschem Token)
- [x] Cleanup-Job (30 Tage), /healthz, /datenschutz
- [x] Playwright-E2E: 16 Tests (mobil+desktop, No-JS-Flow, axe-A11y) — alle grün
- [x] Prod-Smoke mit `node build` (Gate, Login, CSP, ENV-Abbruch geprüft)
- [x] README-Betriebsanleitung, Dockerfile + compose.yml, Screenshots in docs/
- [x] Phase 2: Jetzt-Banner + „Frei bis", Ruhezeiten-Hinweis, Monatsübersicht `/monat`, ICS-Feed `/kalender.ics?token=…` (Token = HMAC aus SESSION_SECRET) — E2E: 25 Tests grün
- [ ] Abschluss: CLAUDE.md (/init), Bericht + WhatsApp-Text — Task 10

## Nächste Schritte

1. /init für CLAUDE.md, Abschlussbericht + WhatsApp-Text an den Hoster

## Gotchas

- E2E: vor dem Tippen `body[data-hydrated]` abwarten (Hydration setzt Feldwerte zurück).
- Login-Rate-Limit beim lokalen Testen: Dev-Server-Neustart setzt die In-Memory-Zähler zurück.
- Playwright-Tests laufen seriell (workers: 1) wegen gemeinsamer DB + Login-Limit.
- `curl` ohne `Accept: text/html` bekommt von Form-Actions JSON statt 303 — normal.
- Drizzle-Config und App lesen `DATABASE_PATH` (nicht DATABASE_URL).
- Hinter Reverse Proxy muss `ORIGIN` gesetzt sein, sonst schlägt der CSRF-Schutz fehl.
- E2E nutzt ein Setup-Projekt + storageState (ein Login pro Lauf); `browser.newContext()` erbt die `use`-Optionen inkl. storageState — für Nicht-eingeloggt-Tests explizit `storageState: { cookies: [], origins: [] }` setzen.
