import { describe, expect, test } from 'vitest';
import { createSessionValue, verifyPassword, verifySessionValue } from './session';

const SECRET = 'test-secret-0123456789abcdef0123456789abcdef';

describe('Session-Cookie', () => {
	test('gültige Session wird akzeptiert', () => {
		const value = createSessionValue(SECRET, 1_000_000);
		expect(verifySessionValue(SECRET, value, 999_999)).toBe(true);
	});

	test('abgelaufene Session wird abgelehnt', () => {
		const value = createSessionValue(SECRET, 1_000_000);
		expect(verifySessionValue(SECRET, value, 1_000_001)).toBe(false);
	});

	test('manipulierte Ablaufzeit wird abgelehnt', () => {
		const value = createSessionValue(SECRET, 1_000_000);
		const [, signature] = value.split('.');
		expect(verifySessionValue(SECRET, `9000000000000.${signature}`, 0)).toBe(false);
	});

	test('falsches Secret wird abgelehnt', () => {
		const value = createSessionValue(SECRET, 1_000_000);
		expect(verifySessionValue('anderes-secret-0123456789abcdef012345678', value, 0)).toBe(false);
	});

	test('kaputte Werte werden abgelehnt', () => {
		expect(verifySessionValue(SECRET, '', 0)).toBe(false);
		expect(verifySessionValue(SECRET, 'nur-ein-teil', 0)).toBe(false);
		expect(verifySessionValue(SECRET, 'abc.def.ghi', 0)).toBe(false);
		expect(verifySessionValue(SECRET, 'NaN.abcdef', 0)).toBe(false);
	});
});

describe('verifyPassword', () => {
	test('vergleicht Passwörter korrekt', () => {
		expect(verifyPassword('geheim', 'geheim')).toBe(true);
		expect(verifyPassword('falsch', 'geheim')).toBe(false);
		expect(verifyPassword('', 'geheim')).toBe(false);
		// unterschiedliche Längen dürfen nicht crashen
		expect(verifyPassword('x'.repeat(500), 'geheim')).toBe(false);
	});
});
