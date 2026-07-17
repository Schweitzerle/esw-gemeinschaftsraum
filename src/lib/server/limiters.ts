import { createRateLimiter } from './rate-limit';

/** Brute-Force-Schutz für die Passwort-Eingabe: 10 Versuche pro Viertelstunde und IP. */
export const loginLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

/** Schreibende Aktionen (Eintrag anlegen/ändern/löschen): 30 pro Minute und IP. */
export const writeLimiter = createRateLimiter({ limit: 30, windowMs: 60 * 1000 });

/** Entfernt regelmäßig abgelaufene Zähler (aufgerufen beim Server-Start). */
export function startLimiterPruning(): void {
	const interval = setInterval(
		() => {
			loginLimiter.prune();
			writeLimiter.prune();
		},
		10 * 60 * 1000
	);
	interval.unref();
}
