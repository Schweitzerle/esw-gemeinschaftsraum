import { getDb } from '$lib/server/db';
import { listBookingsBetween } from '$lib/server/bookings';
import { isRealDate, shiftDate, todayInBerlin, weekDays } from '$lib/time';
import type { PageServerLoad } from './$types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = ({ url }) => {
	const param = url.searchParams.get('datum');
	const date = param && DATE_REGEX.test(param) && isRealDate(param) ? param : todayInBerlin();

	const days = weekDays(date);
	const weekStart = days[0];
	const weekEnd = days[6];
	const bookings = listBookingsBetween(getDb(), weekStart.startMs, weekEnd.endMs);

	return {
		date,
		today: todayInBerlin(),
		prevDate: shiftDate(weekStart.date, -7),
		nextDate: shiftDate(weekStart.date, 7),
		weekStartMs: weekStart.startMs,
		weekEndMs: weekEnd.startMs,
		days: days.map((day) => ({
			date: day.date,
			startMs: day.startMs,
			// Kontakt, Zimmer und Token-Hash bleiben bewusst auf dem Server
			bookings: bookings
				.filter((b) => b.startsAt < day.endMs && b.endsAt > day.startMs)
				.map((b) => ({
					id: b.id,
					title: b.title,
					name: b.name,
					isPublic: b.isPublic,
					startsAt: b.startsAt,
					endsAt: b.endsAt,
					continuesFromPrevDay: b.startsAt < day.startMs,
					continuesIntoNextDay: b.endsAt > day.endMs
				}))
		}))
	};
};
