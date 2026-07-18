import { error, fail, redirect } from '@sveltejs/kit';
import { deleteBookingById, getBookingById } from '$lib/server/bookings';
import { getDb } from '$lib/server/db';
import { writeLimiter } from '$lib/server/limiters';
import { toBerlinDate } from '$lib/time';
import type { Actions, PageServerLoad } from './$types';

function parseId(param: string): number {
	const id = Number(param);
	if (!Number.isInteger(id) || id < 1) {
		error(404, 'Eintrag nicht gefunden');
	}
	return id;
}

export const load: PageServerLoad = ({ params, url }) => {
	const id = parseId(params.id);
	const booking = getBookingById(getDb(), id);
	if (!booking) {
		error(404, 'Eintrag nicht gefunden');
	}

	// Der Token-Hash bleibt auf dem Server
	const { editTokenHash: _editTokenHash, ...publicBooking } = booking;
	return {
		booking: publicBooking,
		weekDate: toBerlinDate(booking.startsAt),
		justSaved: url.searchParams.get('gespeichert') === '1'
	};
};

export const actions: Actions = {
	// Löschen ohne Token — nur angemeldete Bewohner (Auth-Guard sichert das ab).
	// Eigene Einträge löscht man ohne Nachfrage, fremde nach einer Bestätigung im UI.
	loeschen: async ({ params, getClientAddress }) => {
		if (!writeLimiter.check(getClientAddress())) {
			return fail(429, {
				formError: 'Zu viele Anfragen. Bitte warte kurz und probiere es dann nochmal.'
			});
		}
		const id = parseId(params.id);
		const booking = getBookingById(getDb(), id);
		const weekDate = booking ? toBerlinDate(booking.startsAt) : '';
		deleteBookingById(getDb(), id);
		redirect(303, weekDate ? `/?tag=${weekDate}` : '/');
	}
};
