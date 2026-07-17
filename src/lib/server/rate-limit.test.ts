import { describe, expect, test } from 'vitest';
import { createRateLimiter } from './rate-limit';

describe('Rate-Limiter', () => {
	test('erlaubt bis zum Limit und blockiert danach', () => {
		const limiter = createRateLimiter({ limit: 3, windowMs: 60_000 });
		const t0 = 1_000_000;
		expect(limiter.check('ip1', t0)).toBe(true);
		expect(limiter.check('ip1', t0 + 1)).toBe(true);
		expect(limiter.check('ip1', t0 + 2)).toBe(true);
		expect(limiter.check('ip1', t0 + 3)).toBe(false);
	});

	test('zählt pro Schlüssel getrennt', () => {
		const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 });
		const t0 = 0;
		expect(limiter.check('a', t0)).toBe(true);
		expect(limiter.check('b', t0)).toBe(true);
		expect(limiter.check('a', t0 + 1)).toBe(false);
	});

	test('gibt nach Ablauf des Fensters wieder frei', () => {
		const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });
		expect(limiter.check('a', 0)).toBe(true);
		expect(limiter.check('a', 500)).toBe(false);
		expect(limiter.check('a', 1_001)).toBe(true);
	});

	test('räumt alte Einträge auf', () => {
		const limiter = createRateLimiter({ limit: 1, windowMs: 1_000 });
		limiter.check('a', 0);
		limiter.check('b', 0);
		limiter.prune(5_000);
		expect(limiter.size()).toBe(0);
	});
});
