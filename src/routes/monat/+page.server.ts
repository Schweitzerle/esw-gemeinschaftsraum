import { getDb } from '$lib/server/db';
import { listBookingsBetween } from '$lib/server/bookings';
import { isRealDate, monthGrid, monthLabel, shiftMonth, todayInBerlin } from '$lib/time';
import type { PageServerLoad } from './$types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const load: PageServerLoad = ({ url }) => {
	const param = url.searchParams.get('datum');
	const date = param && DATE_REGEX.test(param) && isRealDate(param) ? param : todayInBerlin();

	const weeks = monthGrid(date);
	const gridStart = weeks[0][0];
	const gridEnd = weeks[weeks.length - 1][6];
	const bookings = listBookingsBetween(getDb(), gridStart.startMs, gridEnd.endMs);

	return {
		date,
		today: todayInBerlin(),
		label: monthLabel(date),
		prevDate: shiftMonth(date, -1),
		nextDate: shiftMonth(date, 1),
		weeks: weeks.map((week) =>
			week.map((day) => ({
				date: day.date,
				dayOfMonth: day.dayOfMonth,
				inMonth: day.inMonth,
				count: bookings.filter((b) => b.startsAt < day.endMs && b.endsAt > day.startMs).length
			}))
		)
	};
};
