import { browser } from '$app/environment';

/**
 * Merkt sich auf DIESEM Gerät, welche Einträge man selbst angelegt hat, samt
 * geheimem Bearbeitungs-Token. So kann man eigene Einträge direkt bearbeiten
 * und löschen, ohne sich einen Link merken zu müssen (statt Accounts).
 */
const STORAGE_KEY = 'gr_meine_eintraege';

type Store = Record<string, string>; // { [bookingId]: token }

function read(): Store {
	if (!browser) return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as Store) : {};
	} catch {
		return {};
	}
}

function write(store: Store): void {
	if (!browser) return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
	} catch {
		// localStorage nicht verfügbar (z. B. privater Modus) — dann eben nicht merken
	}
}

/** Merkt sich einen selbst angelegten Eintrag. */
export function rememberBooking(id: number, token: string): void {
	const store = read();
	write({ ...store, [id]: token });
}

/** Gehört dieser Eintrag zu diesem Gerät? */
export function isMyBooking(id: number): boolean {
	return id in read();
}

/** Gespeicherter Token für einen eigenen Eintrag (für den Bearbeiten-Link). */
export function tokenForBooking(id: number): string | undefined {
	return read()[id];
}

/** Vergisst einen Eintrag (nach dem Löschen). */
export function forgetBooking(id: number): void {
	const store = read();
	if (id in store) {
		delete store[id];
		write(store);
	}
}
