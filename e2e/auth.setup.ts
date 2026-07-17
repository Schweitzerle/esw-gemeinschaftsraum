import { expect, test as setup } from '@playwright/test';

export const STORAGE_STATE = 'playwright/.auth/state.json';

/**
 * Loggt sich einmal ein und speichert die Session für alle Tests.
 * So bleibt die Suite unter dem Login-Rate-Limit (10 Versuche / 15 min).
 */
setup('anmelden', async ({ page }) => {
	await page.goto('/login');
	await page.waitForSelector('body[data-hydrated]', { state: 'attached' });
	await page.fill('#passwort', 'e2e-passwort');
	await page.click('button[type=submit]');
	await page.waitForURL('/');
	await expect(page.locator('h1')).toContainText('Wer ist im Raum?');
	await page.context().storageState({ path: STORAGE_STATE });
});
