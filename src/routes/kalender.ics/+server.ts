import { error } from '@sveltejs/kit';
import { listBookingsBetween } from '$lib/server/bookings';
import { getDb } from '$lib/server/db';
import { getConfig } from '$lib/server/env';
import { buildIcsFeed, verifyIcsToken } from '$lib/server/ics';
import type { RequestHandler } from './$types';

/**
 * Read-only-Kalender-Abo. Kalender-Apps senden keine Cookies, deshalb
 * schützt ein Token in der URL den Feed (Link steht auf der Wochenansicht).
 */
export const GET: RequestHandler = ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	if (!verifyIcsToken(token, getConfig().sessionSecret)) {
		error(403, 'Ungültiger Kalender-Link');
	}

	const bookings = listBookingsBetween(getDb(), 0, Number.MAX_SAFE_INTEGER);
	return new Response(buildIcsFeed(bookings), {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Cache-Control': 'private, max-age=300'
		}
	});
};
