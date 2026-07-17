import { describe, expect, test } from 'vitest';
import { monthGrid, monthLabel, shiftMonth } from './time';

describe('monthGrid', () => {
	test('Juli 2026 beginnt mit Mo 29.06. und endet mit So 02.08.', () => {
		const weeks = monthGrid('2026-07-17');
		expect(weeks).toHaveLength(5);
		expect(weeks[0][0].date).toBe('2026-06-29');
		expect(weeks[0][0].inMonth).toBe(false);
		expect(weeks[0][2].date).toBe('2026-07-01');
		expect(weeks[0][2].inMonth).toBe(true);
		expect(weeks[4][6].date).toBe('2026-08-02');
	});

	test('jede Woche hat 7 Tage', () => {
		for (const week of monthGrid('2026-02-10')) {
			expect(week).toHaveLength(7);
		}
	});
});

describe('monthLabel', () => {
	test('deutscher Monatsname', () => {
		expect(monthLabel('2026-07-17')).toBe('Juli 2026');
	});
});

describe('shiftMonth', () => {
	test('verschiebt um ganze Monate', () => {
		expect(shiftMonth('2026-07-17', 1)).toBe('2026-08-01');
		expect(shiftMonth('2026-01-15', -1)).toBe('2025-12-01');
	});
});
