import { expect, test, type Page } from '@playwright/test';

/**
 * Uhrzeit in Berlin auf 30 Minuten abgerundet (Raster der Zeitauswahl),
 * unabhängig von der Zeitzone des Test-Runners (CI = UTC).
 */
function berlinTimeFloor30(offsetMinutes = 0): string {
	const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
	const [hour, minute] = d
		.toLocaleTimeString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' })
		.split(':')
		.map(Number);
	return `${String(hour).padStart(2, '0')}:${minute < 30 ? '00' : '30'}`;
}

async function hydrated(page: Page): Promise<void> {
	await page.waitForSelector('body[data-hydrated]', { state: 'attached' });
}

test.describe.configure({ mode: 'serial' });

test('Startseite zeigt Monatsgitter mit Tages-Panel', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('h1')).toContainText(/\d{4}/);
	expect(await page.locator('.month-day').count()).toBeGreaterThanOrEqual(28);
	await expect(page.locator('.day-panel h2')).toContainText(/\d{2}\./);
});

test('Klick auf freien Tag öffnet den Eintragen-Dialog mit Datum', async ({ page }) => {
	await page.goto('/');
	await hydrated(page);
	// Ein Tag weit in der Zukunft ist sicher frei
	const freeDay = page.locator('.month-day:not(.outside)').last();
	const date = (await freeDay.getAttribute('href'))?.split('tag=')[1] ?? '';
	await freeDay.click();
	await expect(page.locator('dialog[open]')).toBeVisible();
	await expect(page.locator('dialog input[name="date"]')).toHaveValue(date);
	await page.click('dialog .button-quiet:has-text("Abbrechen")');
	await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('vergangene Tage sind nicht buchbar', async ({ page }) => {
	await page.goto('/');
	await hydrated(page);
	// Der 1. des Monats liegt in der Vergangenheit (außer am Monatsersten: dann Vormonat)
	const pastDay = page.locator('.month-day:not(.outside)').first();
	const date = (await pastDay.getAttribute('href'))?.split('tag=')[1] ?? '';
	test.skip(date >= new Date().toISOString().slice(0, 10), 'Monatsanfang – kein vergangener Tag');
	await pastDay.click();
	// Kein Dialog, sondern Auswahl des Tages ohne Eintragen-Button
	await expect(page.locator('dialog[open]')).toHaveCount(0);
	await expect(page).toHaveURL(`/?tag=${date}`);
	await expect(page.locator('.day-panel .button')).toHaveCount(0);
});

test('ICS-Feed liefert Kalender mit Token und 403 ohne', async ({ page, request }) => {
	await page.goto('/');
	await hydrated(page);
	await page.click('.ics-button');
	const icsUrl = await page.locator('#ics-url').inputValue();
	expect(icsUrl).toMatch(/\/kalender\.ics\?token=[A-Za-z0-9_-]{32}$/);

	const ok = await request.get(icsUrl);
	expect(ok.status()).toBe(200);
	expect(ok.headers()['content-type']).toContain('text/calendar');
	expect(await ok.text()).toContain('BEGIN:VCALENDAR');

	const denied = await request.get('/kalender.ics?token=falsch');
	expect(denied.status()).toBe(403);
});

test('Jetzt-Banner zeigt laufende öffentliche Belegung', async ({ page }, testInfo) => {
	// Läuft jetzt: Start auf 30 min abgerundet (innerhalb der Kulanz), Ende in ~2 h
	const start = berlinTimeFloor30(0);
	const end = berlinTimeFloor30(120);
	const title = `Gerade-jetzt ${testInfo.project.name}`;

	await page.goto('/neu');
	await hydrated(page);
	await page.fill('#title', title);
	await page.selectOption('#startTime', start);
	await page.selectOption('#endTime', end);
	await page.fill('#name', 'Bannerin');
	await page.fill('#contact', '0151 777');
	await page.check('#isPublic', { force: true });
	await page.click('main button[type=submit]');
	await page.waitForURL('**/erstellt?token=*');
	const editUrl = await page.inputValue('#edit-link');

	await page.goto('/');
	await expect(page.locator('.now-banner.is-busy')).toContainText(`Jetzt gerade: ${title}`);
	await expect(page.locator('.now-banner.is-busy')).toContainText('komm vorbei');

	// Aufräumen, damit der zweite Projekt-Durchlauf nicht kollidiert
	await page.goto(editUrl);
	await hydrated(page);
	await page.click('summary');
	await page.click('.button-danger');
	await page.waitForURL('**/?tag=*');
});

test('Ruhezeiten-Hinweis steht im Formular', async ({ page }) => {
	await page.goto('/neu');
	await expect(page.locator('.quiet-hours')).toContainText('Ruhezeit');
});
