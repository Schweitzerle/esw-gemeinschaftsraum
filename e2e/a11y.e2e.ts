import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function expectNoSeriousViolations(page: Page): Promise<void> {
	const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
	const serious = results.violations.filter((v) =>
		['serious', 'critical'].includes(v.impact ?? '')
	);
	expect(
		serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} Stellen)`),
		'keine schweren A11y-Verstöße'
	).toEqual([]);
}

test.describe('ohne Anmeldung', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('Login-Seite ist barrierefrei', async ({ page }) => {
		await page.goto('/login');
		await expectNoSeriousViolations(page);
	});
});

test('Hauptseiten sind barrierefrei', async ({ page }) => {
	await page.goto('/');
	await expectNoSeriousViolations(page);

	await page.goto('/neu');
	await expectNoSeriousViolations(page);

	await page.goto('/datenschutz');
	await expectNoSeriousViolations(page);
});

test('Eintragen-Dialog ist barrierefrei', async ({ page }) => {
	await page.goto('/');
	await page.waitForSelector('body[data-hydrated]', { state: 'attached' });
	await page.click('.header-cta');
	await page.waitForSelector('dialog[open]');
	await expectNoSeriousViolations(page);
});
