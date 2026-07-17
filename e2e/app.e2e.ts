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

async function login(page: Page): Promise<void> {
	await page.goto('/login');
	await hydrated(page);
	await page.fill('#passwort', PASSWORT);
	await page.click('button[type=submit]');
	await page.waitForURL('/');
}

interface BookingFormData {
	title: string;
	date: string;
	startTime: string;
	endTime: string;
	name: string;
	room: string;
	contact: string;
}

async function fillBookingForm(page: Page, data: BookingFormData): Promise<void> {
	await page.fill('#title', data.title);
	await page.fill('#date', data.date);
	await page.fill('#startTime', data.startTime);
	await page.fill('#endTime', data.endTime);
	await page.fill('#name', data.name);
	await page.fill('#room', data.room);
	await page.fill('#contact', data.contact);
}

test.describe.configure({ mode: 'serial' });

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

test('kompletter Ablauf: anlegen → Übersicht → Detail → bearbeiten → löschen', async ({
	page
}, testInfo) => {
	const date = inDays(3);
	const title = `E2E-Feier ${testInfo.project.name}`;

	await login(page);

	// Anlegen
	await page.click('a[href="/neu"]');
	await page.waitForURL('**/neu');
	await hydrated(page);
	await fillBookingForm(page, {
		title,
		date,
		startTime: '18:00',
		endTime: '21:00',
		name: 'E2E-Testerin',
		room: '404',
		contact: '0151 5555555'
	});
	await page.check('#isPublic');
	await page.click('main button[type=submit]');

	// Erfolgsseite mit Edit-Link
	await page.waitForURL('**/erstellt?token=*');
	await expect(page.locator('h1')).toContainText('Eingetragen');
	const editUrl = await page.inputValue('#edit-link');
	expect(editUrl).toMatch(/\/eintrag\/\d+\/bearbeiten\?token=[A-Za-z0-9_-]{43}$/);

	// In der Wochenübersicht sichtbar
	await page.goto(`/?datum=${date}`);
	await expect(page.locator('.booking-card', { hasText: title })).toBeVisible();

	// Detailansicht zeigt Kontakt und Zimmer
	await page.locator('.booking-card', { hasText: title }).click();
	await page.waitForURL('**/eintrag/*');
	await expect(page.locator('article')).toContainText('0151 5555555');
	await expect(page.locator('article')).toContainText('404');
	await expect(page.locator('article')).toContainText('komm gern dazu');

	// Überlappung wird verhindert
	await page.goto('/neu');
	await hydrated(page);
	await fillBookingForm(page, {
		title: 'Kollision',
		date,
		startTime: '20:00',
		endTime: '23:00',
		name: 'Zweite',
		room: '1',
		contact: '0000000'
	});
	await page.click('main button[type=submit]');
	await expect(page.locator('.form-error')).toContainText(title);

	// Bearbeiten über den geheimen Link
	await page.goto(editUrl);
	await hydrated(page);
	await page.fill('#title', `${title} (geändert)`);
	await page.click('main form button[type=submit]');
	await page.waitForURL('**/eintrag/*?gespeichert=1');
	await expect(page.locator('.saved-notice')).toBeVisible();
	await expect(page.locator('h1')).toContainText('(geändert)');

	// Falscher Token wird abgelehnt
	const badResponse = await page.goto(editUrl.replace(/token=.{8}/, 'token=XXXXXXXX'));
	expect(badResponse?.status()).toBe(403);

	// Löschen
	await page.goto(editUrl);
	await hydrated(page);
	await page.click('summary');
	await page.click('.button-danger');
	await page.waitForURL('**/?datum=*');
	await expect(page.locator('.booking-card', { hasText: title })).toHaveCount(0);
});

test('funktioniert ohne JavaScript (Progressive Enhancement)', async ({ browser }, testInfo) => {
	const ctx = await browser.newContext({ javaScriptEnabled: false });
	const page = await ctx.newPage();
	const title = `NoJS-Treffen ${testInfo.project.name}`;
	// Pro Projekt ein eigener Tag, damit sich die Durchläufe nicht überlappen
	const date = inDays(testInfo.project.name === 'mobil' ? 10 : 11);

	await page.goto('/login');
	await page.fill('#passwort', PASSWORT);
	await page.click('button[type=submit]');
	await page.waitForURL('/');

	await page.goto('/neu');
	await fillBookingForm(page, {
		title,
		date,
		startTime: '09:00',
		endTime: '10:00',
		name: 'NoJS',
		room: '2',
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
	await page.waitForURL('**/?datum=*');
	await expect(page.locator('.booking-card', { hasText: title })).toHaveCount(0);

	await ctx.close();
});
