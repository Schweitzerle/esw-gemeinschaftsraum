import { describe, expect, test } from 'vitest';
import { berlinDateTimeToMs } from '$lib/time';
import { validateBookingForm } from './booking';

// Fester Bezugszeitpunkt für alle Tests: 17.07.2026 12:00 Berlin
const NOW = berlinDateTimeToMs('2026-07-17', '12:00');

function validForm(overrides: Record<string, string> = {}): Record<string, string> {
	return {
		title: 'Spieleabend',
		date: '2026-07-18',
		startTime: '19:00',
		endTime: '23:00',
		name: 'Julia',
		contact: '0151 12345678',
		isPublic: 'on',
		description: '',
		...overrides
	};
}

describe('validateBookingForm', () => {
	test('akzeptiert gültige Eingaben und berechnet Zeitraum', () => {
		const result = validateBookingForm(validForm(), NOW);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.title).toBe('Spieleabend');
		expect(result.data.isPublic).toBe(true);
		expect(result.data.endsAt - result.data.startsAt).toBe(4 * 60 * 60 * 1000);
	});

	test('fehlende Checkbox bedeutet privat', () => {
		const form = validForm();
		delete form.isPublic;
		const result = validateBookingForm(form, NOW);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.isPublic).toBe(false);
	});

	test('leerer Titel wird abgelehnt', () => {
		const result = validateBookingForm(validForm({ title: '  ' }), NOW);
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.fieldErrors.title).toBeDefined();
	});

	test('Buchung über Mitternacht ist gültig', () => {
		const result = validateBookingForm(validForm({ startTime: '22:00', endTime: '02:00' }), NOW);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.endsAt - result.data.startsAt).toBe(4 * 60 * 60 * 1000);
	});

	test('länger als 12 Stunden wird abgelehnt', () => {
		const result = validateBookingForm(validForm({ startTime: '08:00', endTime: '21:00' }), NOW);
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.fieldErrors.endTime?.[0]).toContain('12 Stunden');
	});

	test('Start in der Vergangenheit wird abgelehnt', () => {
		const result = validateBookingForm(
			validForm({ date: '2026-07-17', startTime: '09:00', endTime: '11:00' }),
			NOW
		);
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.fieldErrors.date?.[0]).toContain('Vergangenheit');
	});

	test('mehr als 3 Monate im Voraus wird abgelehnt', () => {
		const result = validateBookingForm(validForm({ date: '2026-11-01' }), NOW);
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.fieldErrors.date?.[0]).toContain('3 Monate');
	});

	test('ungültiges Datum wird abgelehnt', () => {
		const result = validateBookingForm(validForm({ date: '2026-02-31' }), NOW);
		expect(result.success).toBe(false);
	});

	test('ungültige Uhrzeit wird abgelehnt', () => {
		const result = validateBookingForm(validForm({ startTime: '25:99' }), NOW);
		expect(result.success).toBe(false);
	});

	test('zu lange Beschreibung wird abgelehnt', () => {
		const result = validateBookingForm(validForm({ description: 'x'.repeat(501) }), NOW);
		expect(result.success).toBe(false);
	});

	test('Kontakt ist Pflicht', () => {
		const result = validateBookingForm(validForm({ contact: '' }), NOW);
		expect(result.success).toBe(false);
		if (result.success) return;
		expect(result.fieldErrors.contact).toBeDefined();
	});

	test('Eingaben werden getrimmt', () => {
		const result = validateBookingForm(validForm({ name: '  Julia  ' }), NOW);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.name).toBe('Julia');
	});

	test('leere Endzeit bedeutet offenes Ende (6 Stunden reserviert)', () => {
		const result = validateBookingForm(validForm({ endTime: '' }), NOW);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.openEnd).toBe(true);
		expect(result.data.endsAt - result.data.startsAt).toBe(6 * 60 * 60 * 1000);
	});

	test('gesetzte Endzeit bedeutet kein offenes Ende', () => {
		const result = validateBookingForm(validForm(), NOW);
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.openEnd).toBe(false);
	});
});
