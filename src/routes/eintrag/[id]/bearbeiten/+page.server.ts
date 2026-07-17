import { error, fail, redirect } from '@sveltejs/kit';
import { deleteBooking, getBookingById, updateBooking } from '$lib/server/bookings';
import { getDb } from '$lib/server/db';
import { writeLimiter } from '$lib/server/limiters';
import { verifyToken } from '$lib/server/tokens';
import { formatDate, formatTime, toBerlinDate } from '$lib/time';
import { validateBookingForm } from '$lib/validation/booking';
import type { Booking } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

function loadBookingOrFail(idParam: string, token: string): Booking {
	const id = Number(idParam);
	if (!Number.isInteger(id) || id < 1) {
		error(404, 'Eintrag nicht gefunden');
	}
	const booking = getBookingById(getDb(), id);
	if (!booking) {
		error(404, 'Eintrag nicht gefunden');
	}
	if (!verifyToken(token, booking.editTokenHash)) {
		error(
			403,
			'Dieser Bearbeitungs-Link ist ungültig. Nur mit dem Link, den du beim Eintragen bekommen hast, kannst du den Eintrag ändern.'
		);
	}
	return booking;
}

export const load: PageServerLoad = ({ params, url }) => {
	const token = url.searchParams.get('token') ?? '';
	const booking = loadBookingOrFail(params.id, token);

	return {
		bookingId: booking.id,
		token,
		values: {
			title: booking.title,
			date: toBerlinDate(booking.startsAt),
			startTime: formatTime(booking.startsAt),
			endTime: formatTime(booking.endsAt),
			name: booking.name,
			room: booking.room,
			contact: booking.contact,
			isPublic: booking.isPublic ? 'on' : '',
			description: booking.description ?? ''
		}
	};
};

export const actions: Actions = {
	speichern: async ({ params, request, url, getClientAddress }) => {
		if (!writeLimiter.check(getClientAddress())) {
			return fail(429, {
				formError: 'Zu viele Anfragen. Bitte warte kurz und probiere es dann nochmal.'
			});
		}

		const token = url.searchParams.get('token') ?? '';
		const booking = loadBookingOrFail(params.id, token);
		const formData = await request.formData();
		const values = Object.fromEntries(formData.entries()) as Record<string, string>;
		const result = validateBookingForm(formData);
		if (!result.success) {
			return fail(400, { values, fieldErrors: result.fieldErrors });
		}

		const updated = updateBooking(getDb(), booking.id, token, result.data);
		if (!updated.ok) {
			if (updated.reason === 'conflict') {
				const c = updated.conflict;
				return fail(409, {
					values,
					formError:
						`Der Raum ist dann schon belegt: „${c.title}" von ${c.name} ` +
						`am ${formatDate(c.startsAt)} von ${formatTime(c.startsAt)} bis ${formatTime(c.endsAt)} Uhr.`
				});
			}
			error(403, 'Dieser Bearbeitungs-Link ist ungültig.');
		}

		redirect(303, `/eintrag/${booking.id}?gespeichert=1`);
	},

	loeschen: async ({ params, url, getClientAddress }) => {
		if (!writeLimiter.check(getClientAddress())) {
			return fail(429, {
				formError: 'Zu viele Anfragen. Bitte warte kurz und probiere es dann nochmal.'
			});
		}

		const token = url.searchParams.get('token') ?? '';
		const booking = loadBookingOrFail(params.id, token);

		if (!deleteBooking(getDb(), booking.id, token)) {
			error(403, 'Dieser Bearbeitungs-Link ist ungültig.');
		}

		redirect(303, `/?tag=${toBerlinDate(booking.startsAt)}`);
	}
};
