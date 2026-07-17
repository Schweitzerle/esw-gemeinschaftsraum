import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PASSWORT = 'e2e-passwort';

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

test('Login-Seite ist barrierefrei', async ({ page }) => {
	await page.goto('/login');
	await expectNoSeriousViolations(page);
});

test('Hauptseiten sind barrierefrei', async ({ page }) => {
	await page.goto('/login');
	await page.waitForSelector('body[data-hydrated]', { state: 'attached' });
	await page.fill('#passwort', PASSWORT);
	await page.click('button[type=submit]');
	await page.waitForURL('/');
	await expectNoSeriousViolations(page);

	await page.goto('/neu');
	await expectNoSeriousViolations(page);

	await page.goto('/datenschutz');
	await expectNoSeriousViolations(page);
});
