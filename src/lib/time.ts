import { TZDate } from '@date-fns/tz';
import { addDays, format, startOfWeek } from 'date-fns';
import { de } from 'date-fns/locale';

/** Alle Anzeige- und Eingabezeiten beziehen sich auf die Hauszeit. */
export const TIME_ZONE = 'Europe/Berlin';

function parseDateParts(date: string): [number, number, number] {
	const [year, month, day] = date.split('-').map(Number);
	return [year, month, day];
}

/** Wandelt Berliner Wanduhrzeit (Datum + HH:MM) in Unix-Millisekunden um. */
export function berlinDateTimeToMs(date: string, time: string): number {
	const [year, month, day] = parseDateParts(date);
	const [hours, minutes] = time.split(':').map(Number);
	return new TZDate(year, month - 1, day, hours, minutes, TIME_ZONE).getTime();
}

/** Prüft, ob ein YYYY-MM-DD-String ein real existierendes Datum ist. */
export function isRealDate(date: string): boolean {
	const [year, month, day] = parseDateParts(date);
	const probe = new TZDate(year, month - 1, day, 12, 0, TIME_ZONE);
	return probe.getFullYear() === year && probe.getMonth() === month - 1 && probe.getDate() === day;
}

/**
 * Berechnet den Zeitraum einer Buchung. Liegt die Endzeit nicht nach der
 * Startzeit, endet die Buchung am Folgetag (Buchung über Mitternacht).
 */
export function computeRange(
	date: string,
	startTime: string,
	endTime: string
): { startsAt: number; endsAt: number } {
	const startsAt = berlinDateTimeToMs(date, startTime);
	let endsAt = berlinDateTimeToMs(date, endTime);
	if (endsAt <= startsAt) {
		const nextDay = format(addDays(new TZDate(startsAt, TIME_ZONE), 1), 'yyyy-MM-dd');
		endsAt = berlinDateTimeToMs(nextDay, endTime);
	}
	return { startsAt, endsAt };
}

function tz(ms: number): TZDate {
	return new TZDate(ms, TIME_ZONE);
}

/** „20:00" */
export function formatTime(ms: number): string {
	return format(tz(ms), 'HH:mm');
}

/** „Freitag, 17.07." */
export function formatDayLong(ms: number): string {
	return format(tz(ms), 'EEEE, dd.MM.', { locale: de });
}

/** „17.07.2026" */
export function formatDate(ms: number): string {
	return format(tz(ms), 'dd.MM.yyyy');
}

/** ISO-Datum (YYYY-MM-DD) eines Zeitpunkts in Berliner Zeit. */
export function toBerlinDate(ms: number): string {
	return format(tz(ms), 'yyyy-MM-dd');
}

/** Heutiges Datum in Berlin als YYYY-MM-DD. */
export function todayInBerlin(nowMs: number = Date.now()): string {
	return toBerlinDate(nowMs);
}

export interface DayInfo {
	/** ISO-Datum des Tages (YYYY-MM-DD) */
	date: string;
	/** Tagesbeginn 00:00 Berliner Zeit in Unix-ms */
	startMs: number;
	/** Beginn des Folgetags in Unix-ms */
	endMs: number;
}

/** Verschiebt ein ISO-Datum um n Tage. */
export function shiftDate(date: string, days: number): string {
	const [year, month, day] = parseDateParts(date);
	const noon = new TZDate(year, month - 1, day, 12, 0, TIME_ZONE);
	return format(addDays(noon, days), 'yyyy-MM-dd');
}

export interface MonthDay extends DayInfo {
	/** Tag im Monat (1–31) */
	dayOfMonth: number;
	/** Gehört der Tag zum angezeigten Monat? */
	inMonth: boolean;
}

/** Kalendergitter des Monats: Wochen (Mo–So) mit Rand-Tagen der Nachbarmonate. */
export function monthGrid(date: string): MonthDay[][] {
	const [year, month] = parseDateParts(date);
	const firstOfMonth = new TZDate(year, month - 1, 1, 12, 0, TIME_ZONE);
	const gridStart = startOfWeek(firstOfMonth, { weekStartsOn: 1 });

	const weeks: MonthDay[][] = [];
	let cursor = gridStart;
	do {
		const week: MonthDay[] = [];
		for (let i = 0; i < 7; i++) {
			const dayDate = format(cursor, 'yyyy-MM-dd');
			const nextDate = format(addDays(cursor, 1), 'yyyy-MM-dd');
			week.push({
				date: dayDate,
				startMs: berlinDateTimeToMs(dayDate, '00:00'),
				endMs: berlinDateTimeToMs(nextDate, '00:00'),
				dayOfMonth: cursor.getDate(),
				inMonth: cursor.getMonth() === month - 1
			});
			cursor = addDays(cursor, 1);
		}
		weeks.push(week);
	} while (cursor.getMonth() === month - 1);
	return weeks;
}

/** „Juli 2026" */
export function monthLabel(date: string): string {
	const [year, month] = parseDateParts(date);
	return format(new TZDate(year, month - 1, 1, 12, 0, TIME_ZONE), 'MMMM yyyy', { locale: de });
}

/** Erster Tag des um n Monate verschobenen Monats (für Monats-Navigation). */
export function shiftMonth(date: string, months: number): string {
	const [year, month] = parseDateParts(date);
	return format(new TZDate(year, month - 1 + months, 1, 12, 0, TIME_ZONE), 'yyyy-MM-dd');
}
