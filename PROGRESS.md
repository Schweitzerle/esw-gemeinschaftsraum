# PROGRESS

Belegungsplan für den Gemeinschaftsraum (Studentenwohnheim Regensburg).
Anforderungen: siehe lokale `PROMPT.md` (nicht im Repo) bzw. README.

## Entscheidungen

- Buchungsregeln: max. 3 Monate im Voraus, max. 12 h Dauer, nicht in der Vergangenheit; über Mitternacht = ein Eintrag mit Ende am Folgetag.
- Kontaktnummer erst in der Detailansicht `/eintrag/[id]`, nicht in der Übersicht.
- ENV-Variablen: `HAUS_PASSWORT`, `SESSION_SECRET`, `DATABASE_PATH`, `ORIGIN`, `PORT`.
- Zeiten als Unix-ms (UTC) in SQLite, Anzeige in Europe/Berlin.
- Edit-Token: 32 Byte random, base64url in URL, SHA-256-Hash in DB.
- Phase 2 zusätzlich gewünscht: ICS-Feed, Dark Mode (per prefers-color-scheme), „Frei bis"-Anzeige.
- Kein Startup Mode (Hobby-Projekt): kein SEO, keine Analytics, kein Marketing.

## Stand

- [x] SvelteKit-Scaffold (Svelte 5, TS, adapter-node, Drizzle/better-sqlite3, Vitest, Playwright, ESLint/Prettier)
- [x] Git + GitHub-Repo + CI-Workflow
- [ ] Datenmodell + Server-Logik (TDD) — Task 2
- [ ] Passwort-Gate + Security — Task 3
- [ ] Wochenansicht + Design — Task 4
- [ ] Erstellen + Detail — Task 5
- [ ] Edit-Token-Flow — Task 6
- [ ] Cleanup/Healthz/Datenschutz — Task 7
- [ ] E2E/Screenshots/README/Docker — Task 8
- [ ] Phase 2 — Task 9
- [ ] Abschluss (CLAUDE.md, Bericht, WhatsApp-Text) — Task 10

## Nächste Schritte

1. Drizzle-Schema `bookings` + Migrationen (bei App-Start via `migrate()`)
2. Valibot-Validierung + Überlappungslogik mit Vitest (rot → grün)
3. Passwort-Gate

## Gotchas

- `npm run test:e2e` ruft `playwright install` auf; CI installiert nur Chromium.
- Drizzle-Config und App lesen beide `DATABASE_PATH` (nicht DATABASE_URL).
- SvelteKit-CSRF: hinter Reverse Proxy muss `ORIGIN` gesetzt sein.
