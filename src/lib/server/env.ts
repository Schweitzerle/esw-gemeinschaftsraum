import { env } from '$env/dynamic/private';

export interface AppConfig {
	hausPasswort: string;
	sessionSecret: string;
	databasePath: string;
}

let cached: AppConfig | undefined;

/**
 * Liest und validiert die benötigten ENV-Variablen. Bricht beim ersten
 * Zugriff mit einer klaren Meldung ab, wenn etwas fehlt.
 */
export function getConfig(): AppConfig {
	if (cached) return cached;

	const missing: string[] = [];
	const hausPasswort = env.HAUS_PASSWORT ?? '';
	const sessionSecret = env.SESSION_SECRET ?? '';
	const databasePath = env.DATABASE_PATH ?? '';

	if (!hausPasswort) missing.push('HAUS_PASSWORT');
	if (!sessionSecret) missing.push('SESSION_SECRET');
	if (!databasePath) missing.push('DATABASE_PATH');
	if (missing.length > 0) {
		throw new Error(
			`Fehlende ENV-Variablen: ${missing.join(', ')}. Siehe .env.example für alle benötigten Werte.`
		);
	}
	if (sessionSecret.length < 32) {
		throw new Error(
			'SESSION_SECRET muss mindestens 32 Zeichen lang sein (z. B. mit `openssl rand -hex 32` erzeugen).'
		);
	}

	cached = { hausPasswort, sessionSecret, databasePath };
	return cached;
}
