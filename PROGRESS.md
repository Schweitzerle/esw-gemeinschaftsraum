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
- [x] Phase 2: Jetzt-Banner + „Frei bis", Ruhezeiten-Hinweis, Monatsübersicht, ICS-Feed `/kalender.ics?token=…` (Token = HMAC aus SESSION_SECRET)
- [x] UX-Refactor nach Nutzer-Feedback (17.07.2026): Monat ist jetzt die Startansicht `/` (`?tag=` statt Wochenansicht/`?datum=`), Tages-Panel darunter, Klick auf freien Tag öffnet den Eintragen-Dialog (`BookingDialog.svelte`, No-JS-Fallback `/neu`), Login-Overflow gefixt, Cookie-`secure` via Kit-Default (localhost-http erlaubt)
- [x] Feedback-Runde 2 (18.07.2026): Zimmer-Feld entfernt + Migration 0001 (Spalte `open_end` neu, `room` weg — Migration von Hand geschrieben, drizzle-kit-TUI braucht TTY), Endzeit optional = „offenes Ende" (4 h, `OPEN_END_DURATION_MS`), eigene deutsche Date-/Time-Picker (`DateField`/`TimeSelect`, 30-min-Raster, Kulanz deshalb 30 min), Toggle-Switch + `InfoTip`-Tooltips, Toast-System (`toast.svelte.ts` + `Toasts.svelte`), Eintrag-Detail als Dialog via Shallow Routing (`preloadData`+`pushState`, `page.state.detail`), ICS-Abo-Button in der Navbar (`+layout.server.ts`, `locals.authenticated`), vergangene Tage nicht buchbar — E2E: 31 Tests grün
- [x] Feedback-Runde 3 (18.07.2026): (a) Bugfixes — BookingDialog schließt nach Erfolg (Redirect), Toasts via Popover-API in den Top Layer (sichtbar über `<dialog>`); (b) Bearbeiten-UX ohne „Link speichern"-Zwang: Gerät merkt sich eigene Einträge im localStorage (`$lib/my-bookings.ts`), Detail-Dialog zeigt eigene Einträge mit Bearbeiten/Löschen, fremde nur Löschen mit Bestätigung (`deleteBookingById`, authentifiziert); Edit-Link nur noch als einklappbarer „anderes Gerät"-Fallback — E2E: 33 Tests grün
- [x] Feedback-Runde 4 (18.07.2026): Bearbeiten nutzt jetzt denselben Dialog wie Erstellen (`BookingDialog.openEdit`, postet an die `speichern`-Action, bei Erfolg `invalidateAll`+Toast statt Seitenwechsel) — kein Umweg mehr über Bearbeiten-Seite + Detailseite zurück zum Kalender. Context/Typen in `$lib/booking-dialog.ts`. `/neu` und `/eintrag/[id]/bearbeiten` bleiben No-JS-Fallback — E2E: 33 Tests grün
- [x] Feedback-Runde 5 (19.07.2026): Header sprengte auf schmalen Screens (ab 320px) den Viewport → horizontales Scrollen. Fix in `+layout.svelte`: Titel kürzt per ellipsis (min-width:0, Logo shrink-0), CTA-Label „Eintragen" unter 420px ausgeblendet (nur „+", aria-label bleibt), Titel eine Stufe kleiner. Verifiziert per Playwright-Scan `scrollWidth<=320` auf login/datenschutz/Home/Erstellen-/Detail-/Bearbeiten-Dialog — 59 Unit-, 33 E2E-Tests grün, CI grün
- [x] Feedback-Runde 6 (19.07.2026, Wünsche des Hosters): (1) Öffentlich-Schalter deutlicher — Zustandszeile „✕ Privat" (rot) / „✓ Öffentlich" (grün) + roter Track wenn aus; (2) Live-Warnung unter „Von", wenn Beginn (Datum+Startzeit) in der Vergangenheit liegt; (3) Live-Hinweis unter „Bis" „🌙 Endet am Folgetag (Wochentag, dd.mm.)" wenn Bis ≤ Von; (4) Gerät merkt Name+Kontakt (`$lib/my-identity.ts`, localStorage) mit Consent-Popup vor dem Speichern (auch beim Bearbeiten) + Vorbefüllung; (5) Startseite führt unter dem Tagespanel die nächsten Tage mit Einträgen fort („Weiter geht's", gleiche Kacheln via Snippet, Server: `upcoming` über 21 Tage); (6) ESW-Farben — Rot als Akzent, BG weiß (hell) / schwarz (dunkel), Kontraste WCAG-AA (axe grün). Nötige Refactors: `DateField`/`TimeSelect` `$bindable`, `BookingFormFields` mit lokalem State (Titel/Datum/Zeit/Name/Kontakt kontrolliert, sonst leert ein Re-Render die Felder). Verifiziert: 59 Unit, 36 E2E + 7 axe grün, lint/check/build sauber, Screenshots hell/dunkel. **ESW-Rot liegt in `--color-accent` (`tokens.css`) — exakter Marken-Hex ist eine Stelle zum Feintunen.**
- [x] Feedback-Runde 7 (19.07.2026): Erstellen im Dialog beendet ohne Seitenwechsel — Dialog liest `id`+`token` aus der Redirect-URL, `rememberBooking`, Toast + `invalidateAll` (wie Bearbeiten). Der „anderes Gerät"-Bearbeiten-Link liegt jetzt einklappbar im `DetailDialog` (aus lokalem Token). `/neu` + `/eintrag/[id]/erstellt` bleiben No-JS-Fallback. 59 Unit, 36 E2E, 7 axe grün.
- [ ] Abschluss: Bericht + WhatsApp-Text — Task 10

## Nächste Schritte

1. /init für CLAUDE.md, Abschlussbericht + WhatsApp-Text an den Hoster

## Gotchas

- E2E: vor dem Tippen `body[data-hydrated]` abwarten (Hydration setzt Feldwerte zurück).
- Login-Rate-Limit beim lokalen Testen: Dev-Server-Neustart setzt die In-Memory-Zähler zurück.
- Playwright-Tests laufen seriell (workers: 1) wegen gemeinsamer DB + Login-Limit.
- `curl` ohne `Accept: text/html` bekommt von Form-Actions JSON statt 303 — normal.
- Drizzle-Config und App lesen `DATABASE_PATH` (nicht DATABASE_URL).
- Hinter Reverse Proxy muss `ORIGIN` gesetzt sein, sonst schlägt der CSRF-Schutz fehl.
  `ORIGIN` kennt nur einen Wert; mehrere Hostnamen pro Instanz gehen nur über
  `PROTOCOL_HEADER=x-forwarded-proto` + `HOST_HEADER=x-forwarded-host` (adapter-node) —
  verifiziert: zwei Hosts je 303, fremde `Origin` weiterhin 403, fehlende Header 403.
- E2E nutzt ein Setup-Projekt + storageState (ein Login pro Lauf); `browser.newContext()` erbt die `use`-Optionen inkl. storageState — für Nicht-eingeloggt-Tests explizit `storageState: { cookies: [], origins: [] }` setzen.
