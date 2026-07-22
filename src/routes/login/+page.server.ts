import { fail, redirect } from '@sveltejs/kit';
import { getConfig } from '$lib/server/env';
import { loginLimiter } from '$lib/server/limiters';
import {
	SESSION_COOKIE,
	issueSessionCookie,
	verifyPassword,
	verifySessionValue
} from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

/** Erlaubt nur interne Weiterleitungsziele (kein Open Redirect). */
function safeNext(next: string | null): string {
	if (next && next.startsWith('/') && !next.startsWith('//')) return next;
	return '/';
}

export const load: PageServerLoad = ({ cookies }) => {
	const cookie = cookies.get(SESSION_COOKIE) ?? '';
	if (verifySessionValue(getConfig().sessionSecret, cookie)) {
		redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		if (!loginLimiter.check(getClientAddress())) {
			return fail(429, {
				error: 'Zu viele Versuche. Bitte warte eine Viertelstunde und probiere es dann nochmal.'
			});
		}

		const form = await request.formData();
		const passwort = String(form.get('passwort') ?? '');
		const config = getConfig();

		if (!verifyPassword(passwort, config.hausPasswort)) {
			return fail(400, {
				error:
					'Das Passwort stimmt leider nicht. Das aktuelle Passwort steht in der WhatsApp-Gruppe.'
			});
		}

		issueSessionCookie(cookies, config.sessionSecret);

		redirect(303, safeNext(url.searchParams.get('weiter')));
	}
};
