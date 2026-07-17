import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { startCleanupJob } from '$lib/server/cleanup';
import { getDb } from '$lib/server/db';
import { getConfig } from '$lib/server/env';
import { startLimiterPruning } from '$lib/server/limiters';
import { SESSION_COOKIE, verifySessionValue } from '$lib/server/session';

/** Diese Pfade sind ohne Haus-Passwort erreichbar. */
const PUBLIC_PATHS = new Set(['/login', '/healthz', '/datenschutz']);

if (!building) {
	// Fail fast beim Start: ENV prüfen, DB öffnen und migrieren.
	getConfig();
	getDb();
	startLimiterPruning();
	startCleanupJob();
}

export const handle: Handle = async ({ event, resolve }) => {
	const { pathname, search } = event.url;

	if (!PUBLIC_PATHS.has(pathname)) {
		const cookie = event.cookies.get(SESSION_COOKIE) ?? '';
		if (!verifySessionValue(getConfig().sessionSecret, cookie)) {
			redirect(303, `/login?weiter=${encodeURIComponent(pathname + search)}`);
		}
	}

	const response = await resolve(event);
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	return response;
};
