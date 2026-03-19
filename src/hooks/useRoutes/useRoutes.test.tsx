import { describe, expect, it, vi } from 'vitest';

// Mock config utilities before importing the hook
vi.mock('../../utils/config/index.js', () => ({
	loadGlobalConfig: vi.fn().mockReturnValue({
		version: 1,
		port: 443,
		groups: {
			api: {
				description: 'API routes',
				routes: [{ domain: 'api.local', target: 3000 }],
			},
		},
		latency: { globalMs: 0 },
	}),
	loadLocalConfig: vi.fn().mockReturnValue(null),
	resolveRoutes: vi.fn().mockReturnValue([
		{ domain: 'api.local', target: 3000, groupName: 'api' },
	]),
	saveGlobalConfig: vi.fn(),
	saveLocalConfig: vi.fn(),
}));

import { renderHook } from '@testing-library/react';
import { useRoutes } from './index.js';

describe('useRoutes', () => {
	it('is a function', () => {
		expect(typeof useRoutes).toBe('function');
	});

	it('returns the config mode', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(result.current.mode).toBe('merged');
	});

	it('returns routes array', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(Array.isArray(result.current.routes)).toBe(true);
		expect(result.current.routes.length).toBeGreaterThan(0);
	});

	it('returns global config', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(result.current.global).toBeDefined();
		expect(result.current.global.port).toBe(443);
	});

	it('returns latency config', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(result.current.latency).toBeDefined();
		expect(result.current.latency.globalMs).toBe(0);
	});

	it('returns tagged groups', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(result.current.taggedGroups).toBeDefined();
	});

	it('exposes reload function', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(typeof result.current.reload).toBe('function');
	});

	it('exposes toggleGroup function', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(typeof result.current.toggleGroup).toBe('function');
	});

	it('exposes updateGlobal function', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(typeof result.current.updateGlobal).toBe('function');
	});

	it('exposes setMockVariant function', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(typeof result.current.setMockVariant).toBe('function');
	});

	it('exposes setRouteLatency function', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(typeof result.current.setRouteLatency).toBe('function');
	});

	it('exposes setGlobalLatency function', () => {
		const { result } = renderHook(() => useRoutes('merged'));
		expect(typeof result.current.setGlobalLatency).toBe('function');
	});
});
