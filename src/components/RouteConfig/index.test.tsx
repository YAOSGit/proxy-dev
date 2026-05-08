import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import type { GlobalConfig } from '../../types/Config/index.js';
import { RouteConfig } from './index.js';

const makeGlobal = (): GlobalConfig => ({
	version: 1,
	port: 443,
	groups: {
		api: {
			description: 'API routes',
			routes: [{ domain: 'api.local', target: 3000 }],
		},
	},
	latency: { globalMs: 0 },
});

describe('RouteConfig', () => {
	it('renders the title', () => {
		const { lastFrame } = render(
			<RouteConfig
				global={makeGlobal()}
				updateGlobal={vi.fn()}
				activeGroups={undefined}
				onToggleGroup={vi.fn()}
				onClose={vi.fn()}
				configMode="merged"
				taggedGroups={{
					api: {
						source: 'global',
						originalName: 'api',
						description: 'API routes',
						routes: [{ domain: 'api.local', target: 3000 }],
					},
				}}
			/>,
		);
		expect(lastFrame()).toContain('Route Configuration');
	});

	it('renders group name', () => {
		const { lastFrame } = render(
			<RouteConfig
				global={makeGlobal()}
				updateGlobal={vi.fn()}
				activeGroups={undefined}
				onToggleGroup={vi.fn()}
				onClose={vi.fn()}
				configMode="merged"
				taggedGroups={{
					api: {
						source: 'global',
						originalName: 'api',
						description: 'API routes',
						routes: [{ domain: 'api.local', target: 3000 }],
					},
				}}
			/>,
		);
		expect(lastFrame()).toContain('api');
	});

	it('renders route domain and target', () => {
		const { lastFrame } = render(
			<RouteConfig
				global={makeGlobal()}
				updateGlobal={vi.fn()}
				activeGroups={undefined}
				onToggleGroup={vi.fn()}
				onClose={vi.fn()}
				configMode="merged"
				taggedGroups={{
					api: {
						source: 'global',
						originalName: 'api',
						description: 'API routes',
						routes: [{ domain: 'api.local', target: 3000 }],
					},
				}}
			/>,
		);
		expect(lastFrame()).toContain('api.local');
		expect(lastFrame()).toContain('3000');
	});

	it('renders add group option', () => {
		const { lastFrame } = render(
			<RouteConfig
				global={makeGlobal()}
				updateGlobal={vi.fn()}
				activeGroups={undefined}
				onToggleGroup={vi.fn()}
				onClose={vi.fn()}
				configMode="merged"
				taggedGroups={{
					api: {
						source: 'global',
						originalName: 'api',
						description: 'API routes',
						routes: [{ domain: 'api.local', target: 3000 }],
					},
				}}
			/>,
		);
		expect(lastFrame()).toContain('Add new group');
	});

	it('renders add route option', () => {
		const { lastFrame } = render(
			<RouteConfig
				global={makeGlobal()}
				updateGlobal={vi.fn()}
				activeGroups={undefined}
				onToggleGroup={vi.fn()}
				onClose={vi.fn()}
				configMode="merged"
				taggedGroups={{
					api: {
						source: 'global',
						originalName: 'api',
						description: 'API routes',
						routes: [{ domain: 'api.local', target: 3000 }],
					},
				}}
			/>,
		);
		expect(lastFrame()).toContain('Add route');
	});

	it('shows active indicator for active groups', () => {
		const { lastFrame } = render(
			<RouteConfig
				global={makeGlobal()}
				updateGlobal={vi.fn()}
				activeGroups={['api']}
				onToggleGroup={vi.fn()}
				onClose={vi.fn()}
				configMode="merged"
				taggedGroups={{
					api: {
						source: 'global',
						originalName: 'api',
						description: 'API routes',
						routes: [{ domain: 'api.local', target: 3000 }],
					},
				}}
			/>,
		);
		expect(lastFrame()).toContain('●');
	});
});
