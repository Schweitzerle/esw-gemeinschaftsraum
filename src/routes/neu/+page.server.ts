import { fail, redirect } from '@sveltejs/kit';
import { createBooking } from '$lib/server/bookings';
import { getDb } from '$lib/server/db';
import { writeLimiter } from '$lib/server/limiters';
import { formatDate, formatTime, todayInBerlin } from '$lib/time';
import { validateBookingForm } from '$lib/validation/booking';
import type { Actions, PageServerLoad } from './$types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = ({ url }) => {
	const param = url.searchParams.get('datum');
	return {
		defaultDate: param && DATE_REGEX.test(param) ? param : todayInBerlin()
	};
};

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		if (!writeLimiter.check(getClientAddress())) {
			return fail(429, {
				formError: 'Zu viele Anfragen. Bitte warte kurz und probiere es dann nochmal.'
			});
		}

		const formData = await request.formData();
		const values = Object.fromEntries(formData.entries()) as Record<string, string>;
		const result = validateBookingForm(formData);

		if (!result.success) {
			return fail(400, { values, fieldErrors: result.fieldErrors });
		}

		const created = createBooking(getDb(), result.data);
		if (!created.ok) {
			const c = created.conflict;
			return fail(409, {
				values,
				formError:
					`Der Raum ist dann schon belegt: „${c.title}" von ${c.name} ` +
					`am ${formatDate(c.startsAt)} von ${formatTime(c.startsAt)} bis ${formatTime(c.endsAt)} Uhr. ` +
					'Bitte wähle eine andere Zeit.'
			});
		}

		redirect(303, `/eintrag/${created.booking.id}/erstellt?token=${created.editToken}`);
	}
};
