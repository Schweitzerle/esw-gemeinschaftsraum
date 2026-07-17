import { getDb } from '$lib/server/db';
import { listBookingsBetween } from '$lib/server/bookings';
import { getNowStatus } from '$lib/server/now-status';
import {
	berlinDateTimeToMs,
	isRealDate,
	monthGrid,
	monthLabel,
	shiftDate,
	shiftMonth,
	todayInBerlin
} from '$lib/time';
import { MAX_DURATION_MS } from '$lib/validation/booking';
import type { Booking } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Nur die Felder, die die Übersicht braucht — Kontakt und Token-Hash bleiben auf dem Server. */
function toPublicEntry(booking: Booking, dayStartMs: number, dayEndMs: number) {
	return {
		id: booking.id,
		title: booking.title,
		name: booking.name,
		isPublic: booking.isPublic,
		openEnd: booking.openEnd,
		startsAt: booking.startsAt,
		endsAt: booking.endsAt,
		continuesFromPrevDay: booking.startsAt < dayStartMs,
		continuesIntoNextDay: booking.endsAt > dayEndMs
	};
}

export const load: PageServerLoad = ({ url }) => {
	const param = url.searchParams.get('tag');
	const today = todayInBerlin();
	const selected = param && DATE_REGEX.test(param) && isRealDate(param) ? param : today;

	const weeks = monthGrid(selected);
	const gridStart = weeks[0][0];
	const gridEnd = weeks[weeks.length - 1][6];
	const db = getDb();
	const bookings = listBookingsBetween(db, gridStart.startMs, gridEnd.endMs);

	// „Jetzt gerade"-Status: läuft etwas, und wann geht es heute weiter?
	const nowMs = Date.now();
	const endOfToday = berlinDateTimeToMs(shiftDate(today, 1), '00:00');
	const todayBookings = listBookingsBetween(db, nowMs - MAX_DURATION_MS, endOfToday);
	const { current, next } = getNowStatus(todayBookings, nowMs);

	const selectedDay = weeks.flat().find((d) => d.date === selected) ?? gridStart;

	return {
		selected,
		today,
		label: monthLabel(selected),
		prevMonth: shiftMonth(selected, -1),
		nextMonth: shiftMonth(selected, 1),
		weeks: weeks.map((week) =>
			week.map((day) => ({
				date: day.date,
				dayOfMonth: day.dayOfMonth,
				inMonth: day.inMonth,
				entries: bookings
					.filter((b) => b.startsAt < day.endMs && b.endsAt > day.startMs)
					.map((b) => ({ id: b.id, title: b.title, startsAt: b.startsAt }))
			}))
		),
		dayEntries: bookings
			.filter((b) => b.startsAt < selectedDay.endMs && b.endsAt > selectedDay.startMs)
			.map((b) => toPublicEntry(b, selectedDay.startMs, selectedDay.endMs)),
		dayStartMs: selectedDay.startMs,
		now: {
			current: current
				? {
						id: current.id,
						title: current.title,
						isPublic: current.isPublic,
						openEnd: current.openEnd,
						endsAt: current.endsAt
					}
				: null,
			next: next ? { id: next.id, title: next.title, startsAt: next.startsAt } : null
		}
	};
};
