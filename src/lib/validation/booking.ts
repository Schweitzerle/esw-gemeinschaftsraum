import { z } from 'zod';
import { berlinDateTimeToMs, computeRange, isRealDate } from '$lib/time';

/** Maximal 3 Monate im Voraus buchbar */
export const MAX_ADVANCE_DAYS = 92;
/** Maximale Dauer einer Buchung */
export const MAX_DURATION_MS = 12 * 60 * 60 * 1000;
/** Ohne Endzeit („offenes Ende") wird der Raum so lange reserviert */
export const OPEN_END_DURATION_MS = 4 * 60 * 60 * 1000;
/** Kulanz für „gerade eben begonnene" Buchungen (Zeitauswahl hat 30-min-Raster) */
export const PAST_GRACE_MS = 30 * 60 * 1000;

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const formSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, 'Bitte gib einen Titel oder Anlass an.')
		.max(80, 'Der Titel darf höchstens 80 Zeichen lang sein.'),
	description: z
		.string()
		.trim()
		.max(500, 'Die Beschreibung darf höchstens 500 Zeichen lang sein.')
		.default(''),
	name: z
		.string()
		.trim()
		.min(1, 'Bitte gib deinen Namen an.')
		.max(50, 'Der Name darf höchstens 50 Zeichen lang sein.'),
	contact: z
		.string()
		.trim()
		.min(3, 'Bitte gib eine Kontaktmöglichkeit an (z. B. Handynummer).')
		.max(100, 'Der Kontakt darf höchstens 100 Zeichen lang sein.'),
	date: z
		.string()
		.regex(DATE_REGEX, 'Bitte gib ein gültiges Datum an.')
		.refine(isRealDate, 'Dieses Datum gibt es nicht.'),
	startTime: z.string().regex(TIME_REGEX, 'Bitte gib eine gültige Startzeit an (HH:MM).'),
	// Leer = offenes Ende
	endTime: z
		.string()
		.regex(TIME_REGEX, 'Bitte gib eine gültige Endzeit an (HH:MM).')
		.or(z.literal(''))
		.default('')
});

export interface BookingData {
	title: string;
	description: string | null;
	name: string;
	contact: string;
	isPublic: boolean;
	openEnd: boolean;
	startsAt: number;
	endsAt: number;
}

export type FieldErrors = Partial<Record<keyof z.infer<typeof formSchema> | 'isPublic', string[]>>;

export type BookingFormResult =
	{ success: true; data: BookingData } | { success: false; fieldErrors: FieldErrors };

function toRecord(form: FormData | Record<string, unknown>): Record<string, unknown> {
	if (form instanceof FormData) {
		return Object.fromEntries(form.entries());
	}
	return form;
}

/**
 * Validiert die Formulareingaben für einen Belegungseintrag und berechnet
 * den Zeitraum in Unix-ms. Ohne Endzeit gilt „offenes Ende" (4 h reserviert).
 * Alle Meldungen sind deutsch und feldbezogen.
 */
export function validateBookingForm(
	form: FormData | Record<string, unknown>,
	nowMs: number = Date.now()
): BookingFormResult {
	const raw = toRecord(form);
	const parsed = formSchema.safeParse(raw);
	if (!parsed.success) {
		return { success: false, fieldErrors: z.flattenError(parsed.error).fieldErrors };
	}

	const { date, startTime, endTime, description, ...rest } = parsed.data;
	const openEnd = endTime === '';
	const { startsAt, endsAt } = openEnd
		? (() => {
				const start = berlinDateTimeToMs(date, startTime);
				return { startsAt: start, endsAt: start + OPEN_END_DURATION_MS };
			})()
		: computeRange(date, startTime, endTime);

	const fieldErrors: FieldErrors = {};
	if (startsAt < nowMs - PAST_GRACE_MS) {
		fieldErrors.date = ['Der Beginn liegt in der Vergangenheit.'];
	} else if (startsAt > nowMs + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000) {
		fieldErrors.date = ['Bitte buche höchstens 3 Monate im Voraus.'];
	}
	if (endsAt - startsAt > MAX_DURATION_MS) {
		fieldErrors.endTime = ['Ein Eintrag darf höchstens 12 Stunden dauern.'];
	}
	if (Object.keys(fieldErrors).length > 0) {
		return { success: false, fieldErrors };
	}

	return {
		success: true,
		data: {
			...rest,
			description: description === '' ? null : description,
			isPublic: raw.isPublic !== undefined && raw.isPublic !== '',
			openEnd,
			startsAt,
			endsAt
		}
	};
}
