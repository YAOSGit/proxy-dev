import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import type { TrafficEntry } from '../../types/Traffic/index.js';
import { DetailInspector } from './index.js';

const makeEntry = (): TrafficEntry => ({
	id: '1',
	timestamp: Date.now(),
	method: 'GET',
	domain: 'api.local',
	path: '/users',
	status: 200,
	latencyMs: 10,
	routeState: 'LIVE',
	requestHeaders: { Accept: 'application/json' },
	responseHeaders: { 'Content-Type': 'application/json' },
	requestBody: undefined,
	responseBody: '{"users":[]}',
});

describe('DetailInspector', () => {
	it('renders request pane markers', () => {
		const { lastFrame } = render(
			<DetailInspector
				entry={makeEntry()}
				activePane="request"
				scrollOffset={0}
				onClose={vi.fn()}
				onSwitchPane={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('Request');
	});

	it('renders response pane marker', () => {
		const { lastFrame } = render(
			<DetailInspector
				entry={makeEntry()}
				activePane="response"
				scrollOffset={0}
				onClose={vi.fn()}
				onSwitchPane={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('Response');
	});

	it('shows pane indicators', () => {
		const { lastFrame } = render(
			<DetailInspector
				entry={makeEntry()}
				activePane="request"
				scrollOffset={0}
				onClose={vi.fn()}
				onSwitchPane={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('●');
		expect(lastFrame()).toContain('Response');
	});

	it('renders request headers', () => {
		const { lastFrame } = render(
			<DetailInspector
				entry={makeEntry()}
				activePane="request"
				scrollOffset={0}
				onClose={vi.fn()}
				onSwitchPane={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('Accept');
	});
});
