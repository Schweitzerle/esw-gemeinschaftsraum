import { expect, test, type Page } from '@playwright/test';

/** Datum/Uhrzeit in Berlin, unabhängig von der Zeitzone des Test-Runners (CI = UTC). */
function berlinNow(offsetMinutes = 0): { date: string; time: string } {
	const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
	return {
		date: d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' }),
		time: d.toLocaleTimeString('de-DE', {
			timeZone: 'Europe/Berlin',
			hour: '2-digit',
			minute: '2-digit'
		})
	};
}

async function hydrated(page: Page): Promise<void> {
	await page.waitForSelector('body[data-hydrated]', { state: 'attached' });
}

test.describe.configure({ mode: 'serial' });

test('Monatsübersicht zeigt Kalendergitter und verlinkt zur Woche', async ({ page }) => {
	await page.goto('/');
	await page.click('a[href^="/monat"]');
	await page.waitForURL('**/monat?datum=*');
	await expect(page.locator('h1')).toContainText(/\d{4}/);
	expect(await page.locator('.month-day').count()).toBeGreaterThanOrEqual(28);
	await page.locator('.month-day.today').click();
	await page.waitForURL('**/?datum=*');
	await expect(page.locator('h1')).toContainText('Wer ist im Raum?');
});

test('ICS-Feed liefert Kalender mit Token und 403 ohne', async ({ page, request }) => {
	await page.goto('/');
	const icsUrl = await page.locator('.ics-box input').inputValue();
	expect(icsUrl).toMatch(/\/kalender\.ics\?token=[A-Za-z0-9_-]{32}$/);

	const ok = await request.get(icsUrl);
	expect(ok.status()).toBe(200);
	expect(ok.headers()['content-type']).toContain('text/calendar');
	expect(await ok.text()).toContain('BEGIN:VCALENDAR');

	const denied = await request.get('/kalender.ics?token=falsch');
	expect(denied.status()).toBe(403);
});

test('Jetzt-Banner zeigt laufende öffentliche Belegung', async ({ page }, testInfo) => {
	const start = berlinNow(-5); // vor 5 Minuten begonnen (innerhalb der Kulanz)
	const end = berlinNow(115);
	const title = `Gerade-jetzt ${testInfo.project.name}`;

	await page.goto('/neu');
	await hydrated(page);
	await page.fill('#title', title);
	await page.fill('#date', start.date);
	await page.fill('#startTime', start.time);
	await page.fill('#endTime', end.time);
	await page.fill('#name', 'Bannerin');
	await page.fill('#room', '7');
	await page.fill('#contact', '0151 777');
	await page.check('#isPublic');
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
	await page.waitForURL('**/?datum=*');
});

test('Ruhezeiten-Hinweis steht im Formular', async ({ page }) => {
	await page.goto('/neu');
	await expect(page.locator('.quiet-hours')).toContainText('Ruhezeit');
});
