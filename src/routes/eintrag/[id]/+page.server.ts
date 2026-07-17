import { error } from '@sveltejs/kit';
import { getBookingById } from '$lib/server/bookings';
import { getDb } from '$lib/server/db';
import { toBerlinDate } from '$lib/time';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, url }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id < 1) {
		error(404, 'Eintrag nicht gefunden');
	}
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
