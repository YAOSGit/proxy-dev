import { describe, expect, it, vi } from 'vitest';

const { MockWorker, MockDaemonClient } = vi.hoisted(() => {
	class MockWorker {
		on = vi.fn();
		postMessage = vi.fn();
		terminate = vi.fn();
	}
	class MockDaemonClient {
		register = vi.fn().mockResolvedValue(undefined);
		unregister = vi.fn().mockResolvedValue(undefined);
	}
	return { MockWorker, MockDaemonClient };
});

vi.mock('node:worker_threads', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:worker_threads')>();
	return { ...actual, default: actual, Worker: MockWorker };
});

vi.mock('../../daemon/index.js', () => ({
	DaemonClient: MockDaemonClient,
}));

vi.mock('../../utils/platform/index.js', () => ({
	getDaemonSocketPath: vi.fn().mockReturnValue('/tmp/test.sock'),
}));

import { renderHook } from '@testing-library/react';
import { useProxy } from './index.js';

describe('useProxy', () => {
	it('is a function', () => {
		expect(typeof useProxy).toBe('function');
	});

	it('starts with stopped status', () => {
		const onTraffic = vi.fn();
		const { result } = renderHook(() => useProxy(onTraffic));
		expect(result.current.status).toBe('stopped');
	});

	it('starts with null port', () => {
		const onTraffic = vi.fn();
		const { result } = renderHook(() => useProxy(onTraffic));
		expect(result.current.port).toBeNull();
	});

	it('starts with null lastError', () => {
		const onTraffic = vi.fn();
		const { result } = renderHook(() => useProxy(onTraffic));
		expect(result.current.lastError).toBeNull();
	});

	it('exposes startProxy function', () => {
		const onTraffic = vi.fn();
		const { result } = renderHook(() => useProxy(onTraffic));
		expect(typeof result.current.startProxy).toBe('function');
	});

	it('exposes stopProxy function', () => {
		const onTraffic = vi.fn();
		const { result } = renderHook(() => useProxy(onTraffic));
		expect(typeof result.current.stopProxy).toBe('function');
	});

	it('exposes updateRoutes function', () => {
		const onTraffic = vi.fn();
		const { result } = renderHook(() => useProxy(onTraffic));
		expect(typeof result.current.updateRoutes).toBe('function');
	});

	it('exposes updateLatency function', () => {
		const onTraffic = vi.fn();
		const { result } = renderHook(() => useProxy(onTraffic));
		expect(typeof result.current.updateLatency).toBe('function');
	});

	it('exposes setMock function', () => {
		const onTraffic = vi.fn();
		const { result } = renderHook(() => useProxy(onTraffic));
		expect(typeof result.current.setMock).toBe('function');
	});
});
