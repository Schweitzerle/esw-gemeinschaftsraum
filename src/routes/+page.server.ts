import { getDb } from '$lib/server/db';
import { listBookingsBetween } from '$lib/server/bookings';
import { getConfig } from '$lib/server/env';
import { getIcsToken } from '$lib/server/ics';
import { getNowStatus } from '$lib/server/now-status';
import { berlinDateTimeToMs, isRealDate, shiftDate, todayInBerlin, weekDays } from '$lib/time';
import { MAX_DURATION_MS } from '$lib/validation/booking';
import type { PageServerLoad } from './$types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = ({ url }) => {
	const param = url.searchParams.get('datum');
	const date = param && DATE_REGEX.test(param) && isRealDate(param) ? param : todayInBerlin();

	const days = weekDays(date);
	const weekStart = days[0];
	const weekEnd = days[6];
	const db = getDb();
	const bookings = listBookingsBetween(db, weekStart.startMs, weekEnd.endMs);

	// „Jetzt gerade"-Status: läuft etwas, und wann geht es heute weiter?
	const nowMs = Date.now();
	const endOfToday = berlinDateTimeToMs(shiftDate(todayInBerlin(), 1), '00:00');
	const todayBookings = listBookingsBetween(db, nowMs - MAX_DURATION_MS, endOfToday);
	const { current, next } = getNowStatus(todayBookings, nowMs);

	return {
		now: {
			current: current
				? {
						id: current.id,
						title: current.title,
						isPublic: current.isPublic,
						endsAt: current.endsAt
					}
				: null,
			next: next ? { id: next.id, title: next.title, startsAt: next.startsAt } : null
		},
		icsPath: `/kalender.ics?token=${getIcsToken(getConfig().sessionSecret)}`,
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
