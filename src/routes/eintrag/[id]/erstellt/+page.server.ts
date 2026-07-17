import { error, redirect } from '@sveltejs/kit';
import { getBookingById } from '$lib/server/bookings';
import { getDb } from '$lib/server/db';
import { verifyToken } from '$lib/server/tokens';
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

	const token = url.searchParams.get('token') ?? '';
	if (!verifyToken(token, booking.editTokenHash)) {
		// Ohne gültiges Token gibt es hier nichts zu sehen
		redirect(303, `/eintrag/${id}`);
	}

	return {
		booking: {
			id: booking.id,
			title: booking.title,
			startsAt: booking.startsAt,
			endsAt: booking.endsAt
		},
		editPath: `/eintrag/${id}/bearbeiten?token=${token}`
	};
};
