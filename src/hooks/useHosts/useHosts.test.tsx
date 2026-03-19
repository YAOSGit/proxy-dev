import { describe, expect, it, vi } from 'vitest';

const { MockDaemonClient } = vi.hoisted(() => {
	class MockDaemonClient {
		ping = vi.fn().mockResolvedValue(true);
		addHost = vi.fn().mockResolvedValue(undefined);
		removeHost = vi.fn().mockResolvedValue(undefined);
		cleanup = vi.fn().mockResolvedValue(undefined);
		listHosts = vi.fn().mockResolvedValue([]);
	}
	return { MockDaemonClient };
});

vi.mock('../../daemon/index.js', () => ({
	DaemonClient: MockDaemonClient,
}));

vi.mock('../../utils/platform/index.js', () => ({
	getDaemonSocketPath: vi.fn().mockReturnValue('/tmp/test.sock'),
}));

import { renderHook } from '@testing-library/react';
import { useHosts } from './index.js';

describe('useHosts', () => {
	it('is a function', () => {
		expect(typeof useHosts).toBe('function');
	});

	it('starts with connecting status', () => {
		const { result } = renderHook(() => useHosts());
		expect(result.current.status).toBe('connecting');
	});

	it('starts with empty active domains', () => {
		const { result } = renderHook(() => useHosts());
		expect(result.current.activeDomains).toEqual([]);
	});

	it('exposes addHost function', () => {
		const { result } = renderHook(() => useHosts());
		expect(typeof result.current.addHost).toBe('function');
	});

	it('exposes removeHost function', () => {
		const { result } = renderHook(() => useHosts());
		expect(typeof result.current.removeHost).toBe('function');
	});

	it('exposes cleanup function', () => {
		const { result } = renderHook(() => useHosts());
		expect(typeof result.current.cleanup).toBe('function');
	});

	it('exposes listHosts function', () => {
		const { result } = renderHook(() => useHosts());
		expect(typeof result.current.listHosts).toBe('function');
	});
});
