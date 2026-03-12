import { describe, expect, it } from 'vitest';
import type { TrafficEntry } from '../types/Traffic/index.js';
import { formatLogLine } from './headless.js';

const makeEntry = (overrides: Partial<TrafficEntry> = {}): TrafficEntry => ({
	id: '1',
	timestamp: new Date('2026-01-15T14:30:45.000Z').getTime(),
	method: 'GET',
	domain: 'test.local',
	path: '/api/users',
	status: 200,
	latencyMs: 42,
	routeState: 'LIVE',
	requestHeaders: {},
	responseHeaders: {},
	...overrides,
});

describe('formatLogLine', () => {
	it('formats a LIVE request as a single line', () => {
		const line = formatLogLine(makeEntry());
		expect(line).toContain('GET test.local/api/users');
		expect(line).toContain('200');
		expect(line).toContain('42ms');
		expect(line).not.toContain('MOCK');
	});

	it('includes mock tag for MOCK entries', () => {
		const line = formatLogLine(
			makeEntry({
				routeState: 'MOCK',
				mockVariant: 'success',
			}),
		);
		expect(line).toContain('[MOCK:success]');
	});

	it('uses ? for MOCK entries without a variant name', () => {
		const line = formatLogLine(
			makeEntry({
				routeState: 'MOCK',
				mockVariant: undefined,
			}),
		);
		expect(line).toContain('[MOCK:?]');
	});
});
