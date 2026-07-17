import { rmSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Jeder Testlauf startet mit leerer Datenbank
const TEST_DB = 'data/e2e-test.db';
for (const suffix of ['', '-wal', '-shm']) {
	rmSync(TEST_DB + suffix, { force: true });
}

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	// Gemeinsame DB und Login-Rate-Limit: seriell testen
	workers: 1,
	use: { baseURL: 'http://localhost:4173' },
	projects: [
		{ name: 'mobil', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } }
	],
	webServer: {
		command: 'npm run build && npm run preview',
		port: 4173,
		env: {
			HAUS_PASSWORT: 'e2e-passwort',
			SESSION_SECRET: 'e2e-secret-0123456789abcdef0123456789abcdef',
			DATABASE_PATH: TEST_DB
		}
	}
});
