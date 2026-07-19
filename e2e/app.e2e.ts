import { expect, test, type Page } from '@playwright/test';

const PASSWORT = 'e2e-passwort';

/** Datum in n Tagen als YYYY-MM-DD (lokale Zeit reicht für Testzwecke). */
function inDays(n: number): string {
	const d = new Date(Date.now() + n * 24 * 60 * 60 * 1000);
	return d.toISOString().slice(0, 10);
}

/** Wartet, bis Svelte hydriert hat, bevor in Formulare getippt wird. */
async function hydrated(page: Page): Promise<void> {
	await page.waitForSelector('body[data-hydrated]', { state: 'attached' });
}

interface BookingFormData {
	title: string;
	startTime: string;
	endTime: string;
	name: string;
	contact: string;
}

/** Füllt alle Felder außer dem Datum (das kommt aus dem Tag-Klick bzw. Vorbelegung). */
async function fillBookingForm(page: Page, data: BookingFormData): Promise<void> {
	await page.fill('#title', data.title);
	await page.selectOption('#startTime', data.startTime);
	await page.selectOption('#endTime', data.endTime);
	await page.fill('#name', data.name);
	await page.fill('#contact', data.contact);
}

/** Nach dem Absenden im Dialog erscheint evtl. die „merken?"-Nachfrage — wegklicken. */
async function dismissRememberPopup(page: Page): Promise<void> {
	const nein = page.locator('.remember-overlay button', { hasText: 'Nein' });
	try {
		await nein.waitFor({ state: 'visible', timeout: 1500 });
		await nein.click();
	} catch {
		// kein Popup (z. B. unveränderte, bereits gemerkte Daten) — nichts zu tun
	}
}

test.describe.configure({ mode: 'serial' });

test.describe('ohne Anmeldung', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('leitet ohne Anmeldung zum Login um', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL(/\/login/);
		await expect(page.locator('h1')).toContainText('Gemeinschaftsraum');
	});

	test('healthz ist ohne Anmeldung erreichbar', async ({ request }) => {
		const res = await request.get('/healthz');
		expect(res.status()).toBe(200);
		expect(await res.json()).toEqual({ status: 'ok' });
	});

	test('Datenschutz ist ohne Anmeldung erreichbar', async ({ page }) => {
		await page.goto('/datenschutz');
		await expect(page.locator('h1')).toContainText('Datenschutz');
	});

	test('falsches Passwort zeigt Fehlermeldung', async ({ page }) => {
		await page.goto('/login');
		await hydrated(page);
		await page.fill('#passwort', 'voellig-falsch');
		await page.click('button[type=submit]');
		await expect(page.locator('.form-error')).toContainText('stimmt leider nicht');
	});
});

test('kompletter Ablauf: anlegen → Übersicht → Detail → bearbeiten → löschen', async ({
	page
}, testInfo) => {
	const date = inDays(3);
	const title = `E2E-Feier ${testInfo.project.name}`;

	// Anlegen: Klick auf den freien Tag öffnet den Dialog mit vorbelegtem Datum
	// (erst zum Zielmonat navigieren, damit die Zelle sicher im Gitter liegt)
	await page.goto(`/?tag=${date}`);
	await hydrated(page);
	await page.click(`.month a[href="/?tag=${date}"]`);
	await expect(page.locator('dialog[open]')).toBeVisible();
	await expect(page.locator('dialog input[name="date"]')).toHaveValue(date);
	await fillBookingForm(page, {
		title,
		startTime: '18:00',
		endTime: '21:00',
		name: 'E2E-Testerin',
		contact: '0151 5555555'
	});
	await page.check('#isPublic', { force: true });
	await page.click('dialog button[type=submit]');
	await dismissRememberPopup(page);

	// Kein Seitenwechsel mehr: Toast + Dialog zu, Eintrag steht direkt im Kalender
	await expect(page.locator('.toast-success')).toBeVisible();
	await expect(page.locator('dialog[open]')).toHaveCount(0);
	await page.goto(`/?tag=${date}`);
	await hydrated(page);
	await expect(page.locator('.booking-card', { hasText: title })).toBeVisible();

	// Detail-Dialog zeigt Kontakt und – weil dieses Gerät den Eintrag angelegt hat –
	// direkt Bearbeiten/Löschen (Shallow Routing, URL wechselt mit)
	await page.locator('.booking-card', { hasText: title }).click();
	await expect(page.locator('dialog[open]')).toContainText('0151 5555555');
	await expect(page.locator('dialog[open]')).toContainText('komm gern dazu');
	await expect(page).toHaveURL(/\/eintrag\/\d+/);
	await expect(page.locator('dialog[open] button', { hasText: 'Bearbeiten' })).toBeVisible();

	// Der geheime Edit-Link fürs andere Gerät steckt jetzt im Detail-Dialog
	await page.click('dialog[open] .other-device summary');
	const editUrl = await page.inputValue('#share-link');
	expect(editUrl).toMatch(/\/eintrag\/\d+\/bearbeiten\?token=[A-Za-z0-9_-]{43}$/);

	// Bearbeiten öffnet denselben Dialog, vorbefüllt – kein Seitenwechsel
	await page.click('dialog[open] button:has-text("Bearbeiten")');
	await expect(page.locator('dialog[open] h2')).toContainText('Eintrag bearbeiten');
	await expect(page.locator('dialog[open] #title')).toHaveValue(title);
	await page.fill('dialog[open] #title', `${title} (geändert)`);
	await page.click('dialog[open] button:has-text("Änderungen speichern")');
	await dismissRememberPopup(page);
	// Dialog schließt, Kalender bleibt, Erfolgs-Toast, geänderter Titel sichtbar
	await expect(page.locator('dialog[open]')).toHaveCount(0);
	await expect(page.locator('.toast-success')).toBeVisible();
	await expect(page.locator('.booking-card', { hasText: `${title} (geändert)` })).toBeVisible();

	// Überlappung wird verhindert (Dialog bleibt offen, Konflikt als Toast + Meldung)
	await page.goto(`/?tag=${date}`);
	await hydrated(page);
	await page.click('.day-panel .button');
	await expect(page.locator('dialog[open]')).toBeVisible();
	await fillBookingForm(page, {
		title: 'Kollision',
		startTime: '20:00',
		endTime: '23:00',
		name: 'Zweite',
		contact: '0000000'
	});
	await page.click('dialog button[type=submit]');
	await dismissRememberPopup(page);
	await expect(page.locator('.toast-error')).toContainText(title);
	await expect(page.locator('dialog .form-error')).toContainText(title);
	await page.click('dialog .button-quiet:has-text("Abbrechen")');

	// Falscher Bearbeiten-Token wird weiterhin abgelehnt
	const badResponse = await page.goto(editUrl.replace(/token=.{8}/, 'token=XXXXXXXX'));
	expect(badResponse?.status()).toBe(403);

	// Löschen direkt aus dem Detail-Dialog (eigener Eintrag → ohne Nachfrage)
	await page.goto(`/?tag=${date}`);
	await hydrated(page);
	await page.locator('.booking-card', { hasText: title }).click();
	await page.click('dialog[open] button:has-text("Löschen")');
	await page.waitForURL('**/?tag=*');
	await expect(page.locator('.booking-card', { hasText: title })).toHaveCount(0);
});

test('fremden Eintrag löschen geht nur mit Bestätigung (Notnagel)', async ({ page }, testInfo) => {
	const date = inDays(20);
	const title = `Fremd ${testInfo.project.name}`;

	// Anlegen
	await page.goto(`/?tag=${date}`);
	await hydrated(page);
	await page.click(`.month a[href="/?tag=${date}"]`);
	await expect(page.locator('dialog[open]')).toBeVisible();
	await fillBookingForm(page, {
		title,
		startTime: '14:00',
		endTime: '16:00',
		name: 'Fremdine',
		contact: '0151 4444444'
	});
	await page.click('dialog button[type=submit]');
	await dismissRememberPopup(page);
	await expect(page.locator('.toast-success')).toBeVisible();
	await expect(page.locator('dialog[open]')).toHaveCount(0);

	// Gerät „vergisst" den Eintrag → jetzt gilt er als fremd
	await page.evaluate(() => localStorage.clear());

	await page.goto(`/?tag=${date}`);
	await hydrated(page);
	await page.locator('.booking-card', { hasText: title }).click();
	// Kein Bearbeiten, aber Löschen mit Bestätigung
	await expect(page.locator('dialog[open] a', { hasText: 'Bearbeiten' })).toHaveCount(0);
	await page.click('dialog[open] button:has-text("Eintrag löschen")');
	await expect(page.locator('dialog[open] .confirm-text')).toContainText('Fremdine');
	await page.click('dialog[open] button:has-text("Ja, löschen")');
	await page.waitForURL('**/?tag=*');
	await expect(page.locator('.booking-card', { hasText: title })).toHaveCount(0);
});

test('merkt Name & Kontakt nach Zustimmung und füllt sie vor', async ({ page }, testInfo) => {
	const date = inDays(25);
	const title = `Merk ${testInfo.project.name}`;

	await page.goto(`/?tag=${date}`);
	await hydrated(page);
	await page.evaluate(() => localStorage.clear());

	// Anlegen mit Zustimmung „Ja, merken"
	await page.click(`.month a[href="/?tag=${date}"]`);
	await expect(page.locator('dialog[open]')).toBeVisible();
	await fillBookingForm(page, {
		title,
		startTime: '08:00',
		endTime: '09:00',
		name: 'Merkfried',
		contact: '0151 2223334'
	});
	await page.click('dialog button[type=submit]');
	await page.click('.remember-overlay button:has-text("Ja")');
	await expect(page.locator('.toast-success')).toBeVisible();
	await expect(page.locator('dialog[open]')).toHaveCount(0);

	// Neuer Dialog an einem anderen Tag: Name & Kontakt sind vorbefüllt
	const otherDate = inDays(26);
	await page.goto(`/?tag=${otherDate}`);
	await hydrated(page);
	await page.click(`.month a[href="/?tag=${otherDate}"]`);
	await expect(page.locator('dialog[open] #name')).toHaveValue('Merkfried');
	await expect(page.locator('dialog[open] #contact')).toHaveValue('0151 2223334');

	// Aufräumen: eigenen Eintrag löschen (Token noch vorhanden), dann Speicher leeren
	await page.goto(`/?tag=${date}`);
	await hydrated(page);
	await page.locator('.booking-card', { hasText: title }).click();
	await page.click('dialog[open] button:has-text("Löschen")');
	await page.waitForURL('**/?tag=*');
	await page.evaluate(() => localStorage.clear());
});

test('funktioniert ohne JavaScript (Progressive Enhancement)', async ({ browser }, testInfo) => {
	// Eigener Context ohne JS und ohne die geteilte Session — der Login läuft hier mit
	const ctx = await browser.newContext({
		javaScriptEnabled: false,
		storageState: { cookies: [], origins: [] }
	});
	const page = await ctx.newPage();
	const title = `NoJS-Treffen ${testInfo.project.name}`;
	// Pro Projekt ein eigener Tag, damit sich die Durchläufe nicht überlappen
	const date = inDays(testInfo.project.name === 'mobil' ? 10 : 11);

	await page.goto('/login');
	await page.fill('#passwort', PASSWORT);
	await page.click('button[type=submit]');
	await page.waitForURL('/');

	await page.goto('/neu');
	// Ohne JS bleibt das native Datumsfeld stehen
	await page.fill('#date', date);
	await fillBookingForm(page, {
		title,
		startTime: '09:00',
		endTime: '10:00',
		name: 'NoJS',
		contact: '0151 999'
	});
	await page.click('main button[type=submit]');
	await page.waitForURL('**/erstellt?token=*');
	await expect(page.locator('h1')).toContainText('Eingetragen');

	// Löschen funktioniert auch ohne JS (details/summary + Formular)
	const editUrl = await page.inputValue('#edit-link');
	await page.goto(editUrl);
	await page.click('summary');
	await page.click('.button-danger');
	await page.waitForURL('**/?tag=*');
	await expect(page.locator('.booking-card', { hasText: title })).toHaveCount(0);

	await ctx.close();
});
