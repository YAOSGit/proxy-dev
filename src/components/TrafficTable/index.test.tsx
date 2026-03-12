import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import type { TrafficEntry } from '../../types/Traffic/index.js';
import { TrafficTable } from './index.js';

const makeEntry = (id: string, method = 'GET', status = 200): TrafficEntry => ({
	id,
	timestamp: Date.now(),
	method,
	domain: 'api.local',
	path: '/users',
	status,
	latencyMs: 12,
	routeState: 'LIVE',
	requestHeaders: {},
	responseHeaders: {},
});

describe('TrafficTable', () => {
	it('shows waiting message when empty', () => {
		const { lastFrame } = render(
			<TrafficTable entries={[]} selectedIndex={-1} height={20} />,
		);
		expect(lastFrame()).toContain('Waiting');
	});

	it('renders request entries', () => {
		const entries = [makeEntry('1'), makeEntry('2', 'POST', 201)];
		const { lastFrame } = render(
			<TrafficTable entries={entries} selectedIndex={0} height={20} />,
		);
		expect(lastFrame()).toContain('api.local');
	});

	it('shows selected indicator', () => {
		const entries = [makeEntry('1')];
		const { lastFrame } = render(
			<TrafficTable entries={entries} selectedIndex={0} height={20} />,
		);
		expect(lastFrame()).toContain('▸');
	});
});
