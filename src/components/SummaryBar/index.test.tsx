import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import type { TrafficEntry } from '../../types/Traffic/index.js';
import { SummaryBar } from './index.js';

const makeEntry = (): TrafficEntry => ({
	id: '1',
	timestamp: Date.now(),
	method: 'GET',
	domain: 'api.local',
	path: '/users',
	status: 200,
	latencyMs: 10,
	routeState: 'LIVE',
	requestHeaders: { Accept: 'application/json', Host: 'api.local' },
	responseHeaders: { 'Content-Type': 'application/json' },
	requestBody: undefined,
	responseBody: '{"users":[]}',
});

describe('SummaryBar', () => {
	it('renders placeholder when no entry is selected', () => {
		const { lastFrame } = render(<SummaryBar entry={null} />);
		expect(lastFrame()).toContain('Select a request');
	});

	it('renders request header count', () => {
		const { lastFrame } = render(<SummaryBar entry={makeEntry()} />);
		expect(lastFrame()).toContain('Req Headers:');
		expect(lastFrame()).toContain('2');
	});

	it('renders response header count', () => {
		const { lastFrame } = render(<SummaryBar entry={makeEntry()} />);
		expect(lastFrame()).toContain('Res Headers:');
		expect(lastFrame()).toContain('1');
	});

	it('renders body size', () => {
		const { lastFrame } = render(<SummaryBar entry={makeEntry()} />);
		expect(lastFrame()).toContain('Body:');
	});

	it('renders content type', () => {
		const { lastFrame } = render(<SummaryBar entry={makeEntry()} />);
		expect(lastFrame()).toContain('application/json');
	});

	it('shows unknown content type when missing', () => {
		const entry = makeEntry();
		entry.responseHeaders = {};
		const { lastFrame } = render(<SummaryBar entry={entry} />);
		expect(lastFrame()).toContain('unknown');
	});
});
