import { browser } from '$app/environment';

/**
 * Merkt sich auf DIESEM Gerät Name + Kontakt, damit man sie beim nächsten
 * Eintrag nicht neu eintippen muss. Rein lokal (localStorage), nichts geht an
 * den Server außer beim tatsächlichen Speichern eines Eintrags. Vor dem Merken
 * fragt der Dialog einmal kurz nach (Consent).
 */
const STORAGE_KEY = 'gr_meine_identitaet';

export interface Identity {
	name: string;
	contact: string;
}

// „Diesmal nicht merken" — nur für die aktuelle Seitensitzung, nicht persistiert.
let declinedThisSession = false;

/** Gespeicherte Identität dieses Geräts oder null. */
export function loadIdentity(): Identity | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Partial<Identity>;
		if (typeof parsed?.name === 'string' && typeof parsed?.contact === 'string') {
			const name = parsed.name.trim();
			const contact = parsed.contact.trim();
			if (name && contact) return { name, contact };
		}
		return null;
	} catch {
		return null;
	}
}

/** Merkt sich Name + Kontakt auf diesem Gerät. */
export function saveIdentity(name: string, contact: string): void {
	if (!browser) return;
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ name: name.trim(), contact: contact.trim() })
		);
		declinedThisSession = false;
	} catch {
		// localStorage nicht verfügbar (z. B. privater Modus) — dann eben nicht merken
	}
}

/** Vergisst die gespeicherte Identität. */
export function forgetIdentity(): void {
	if (!browser) return;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// ignorieren
	}
}

/** Stimmt die gespeicherte Identität exakt mit diesen Werten überein? */
export function identityMatches(name: string, contact: string): boolean {
	const stored = loadIdentity();
	return !!stored && stored.name === name.trim() && stored.contact === contact.trim();
}

/** Nutzer hat „nicht merken" gewählt — für diese Sitzung nicht mehr nachfragen. */
export function declineIdentityThisSession(): void {
	declinedThisSession = true;
}

/**
 * Soll vor dem Speichern gefragt werden? Nur wenn Werte da sind, sie noch nicht
 * exakt gemerkt sind und nicht schon „nicht merken" gewählt wurde.
 */
export function shouldAskToRemember(name: string, contact: string): boolean {
	if (!browser) return false;
	const trimmedName = name.trim();
	const trimmedContact = contact.trim();
	if (!trimmedName || !trimmedContact) return false;
	if (declinedThisSession) return false;
	return !identityMatches(trimmedName, trimmedContact);
}
