import { describe, expect, it } from 'vitest';
import {
	formatLatency,
	formatMethod,
	formatStatus,
	truncateBody,
} from './index.js';

describe('format utilities', () => {
	describe('formatMethod', () => {
		it('returns a string for GET', () => {
			const result = formatMethod('GET');
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		it('handles unknown method', () => {
			const result = formatMethod('CUSTOM');
			expect(result).toContain('CUSTOM');
		});

		it('is case-insensitive', () => {
			const upper = formatMethod('GET');
			const lower = formatMethod('get');
			// Strip ANSI codes for comparison
			// biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape stripping requires control chars
			const stripAnsi = (s: string) => s.replace(/\x1B\[[0-9;]*m/g, '');
			expect(stripAnsi(upper).trim()).toBe(stripAnsi(lower).trim());
		});
	});

	describe('formatStatus', () => {
		it('returns string for 200', () => {
			const result = formatStatus(200);
			expect(result).toContain('200');
		});

		it('returns string for 404', () => {
			const result = formatStatus(404);
			expect(result).toContain('404');
		});

		it('returns string for 500', () => {
			const result = formatStatus(500);
			expect(result).toContain('500');
		});
	});

	describe('formatLatency', () => {
		it('formats ms under 1000', () => {
			expect(formatLatency(150)).toBe('150ms');
		});

		it('formats as seconds over 1000ms', () => {
			expect(formatLatency(1500)).toBe('1.5s');
		});

		it('formats 0ms', () => {
			expect(formatLatency(0)).toBe('0ms');
		});
	});

	describe('truncateBody', () => {
		it('returns body unchanged if under limit', () => {
			expect(truncateBody('hello', 100)).toBe('hello');
		});

		it('truncates with indicator if over limit', () => {
			const result = truncateBody('a'.repeat(200), 100);
			expect(result).toContain('[truncated]');
			expect(result.length).toBeLessThan(200);
		});
	});
});
