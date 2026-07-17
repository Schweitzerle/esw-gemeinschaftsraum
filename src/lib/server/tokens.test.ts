import { describe, expect, test } from 'vitest';
import { generateEditToken, hashToken, verifyToken } from './tokens';

describe('Edit-Tokens', () => {
	test('erzeugt URL-sicheres Token mit passendem Hash', () => {
		const { token, hash } = generateEditToken();
		expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 Byte base64url
		expect(hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
		expect(hashToken(token)).toBe(hash);
	});

	test('zwei Tokens sind verschieden', () => {
		expect(generateEditToken().token).not.toBe(generateEditToken().token);
	});

	test('verifyToken akzeptiert nur das richtige Token', () => {
		const { token, hash } = generateEditToken();
		expect(verifyToken(token, hash)).toBe(true);
		expect(verifyToken(generateEditToken().token, hash)).toBe(false);
		expect(verifyToken('', hash)).toBe(false);
		expect(verifyToken('kein-base64url-!!!', hash)).toBe(false);
	});
});
