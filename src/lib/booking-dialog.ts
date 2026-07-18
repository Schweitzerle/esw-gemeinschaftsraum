import { formatTime, toBerlinDate } from '$lib/time';

/** Daten zum Öffnen des Dialogs im Bearbeiten-Modus. */
export interface EditPayload {
	id: number;
	token: string;
	values: Record<string, string>;
}

/** Svelte-Context, über den Seiten den Eintragen-/Bearbeiten-Dialog steuern. */
export interface BookingDialogContext {
	/** Öffnet den Dialog zum Erstellen, mit vorbelegtem Datum. */
	open: (date: string) => void;
	/** Öffnet den Dialog zum Bearbeiten eines bestehenden Eintrags. */
	openEdit: (payload: EditPayload) => void;
}

export const BOOKING_DIALOG_KEY = 'booking-dialog';

interface EditableBooking {
	title: string;
	description: string | null;
	name: string;
	contact: string;
	isPublic: boolean;
	openEnd: boolean;
	startsAt: number;
	endsAt: number;
}

/** Baut die vorbefüllten Formularwerte aus einem bestehenden Eintrag. */
export function bookingToEditValues(booking: EditableBooking): Record<string, string> {
	return {
		title: booking.title,
		date: toBerlinDate(booking.startsAt),
		startTime: formatTime(booking.startsAt),
		endTime: booking.openEnd ? '' : formatTime(booking.endsAt),
		name: booking.name,
		contact: booking.contact,
		isPublic: booking.isPublic ? 'on' : '',
		description: booking.description ?? ''
	};
}
