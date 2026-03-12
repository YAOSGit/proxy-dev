import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { TrafficEntry } from '../../types/Traffic/index.js';
import { MAX_ENTRIES, useTraffic } from './index.js';

const makeEntry = (id: string): TrafficEntry => ({
	id,
	timestamp: Date.now(),
	method: 'GET',
	domain: 'api.local',
	path: '/users',
	status: 200,
	latencyMs: 10,
	routeState: 'LIVE',
	requestHeaders: {},
	responseHeaders: {},
});

describe('useTraffic', () => {
	it('starts with empty entries', () => {
		const { result } = renderHook(() => useTraffic());
		expect(result.current.entries).toHaveLength(0);
	});

	it('adds entries', () => {
		const { result } = renderHook(() => useTraffic());
		act(() => {
			result.current.addEntry(makeEntry('1'));
		});
		expect(result.current.entries).toHaveLength(1);
	});

	it('clears entries', () => {
		const { result } = renderHook(() => useTraffic());
		act(() => {
			result.current.addEntry(makeEntry('1'));
			result.current.clear();
		});
		expect(result.current.entries).toHaveLength(0);
	});

	it('caps at MAX_ENTRIES', () => {
		const { result } = renderHook(() => useTraffic());
		act(() => {
			for (let i = 0; i < MAX_ENTRIES + 100; i++) {
				result.current.addEntry(makeEntry(String(i)));
			}
		});
		expect(result.current.entries.length).toBeLessThanOrEqual(MAX_ENTRIES);
	});

	it('getSelectedEntry returns null when no selection', () => {
		const { result } = renderHook(() => useTraffic());
		expect(result.current.getSelectedEntry()).toBeNull();
	});

	it('selectIndex updates selectedIndex', () => {
		const { result } = renderHook(() => useTraffic());
		act(() => {
			result.current.addEntry(makeEntry('1'));
			result.current.selectIndex(0);
		});
		expect(result.current.selectedIndex).toBe(0);
	});
});
