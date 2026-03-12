import { describe, expect, it } from 'vitest';
import { applyLatency, resolveLatency } from './latency.js';

describe('latency resolution', () => {
	it('returns 0 when no latency configured', () => {
		expect(resolveLatency(undefined, { globalMs: 0 })).toBe(0);
	});

	it('returns global latency when no route override', () => {
		expect(resolveLatency(undefined, { globalMs: 200 })).toBe(200);
	});

	it('route latency overrides global', () => {
		expect(resolveLatency(500, { globalMs: 200 })).toBe(500);
	});

	it('mock variant latency overrides route', () => {
		expect(resolveLatency(500, { globalMs: 200 }, 1000)).toBe(1000);
	});

	it('route latency of 0 overrides global', () => {
		expect(resolveLatency(0, { globalMs: 500 })).toBe(0);
	});
});

describe('applyLatency', () => {
	it('resolves immediately for 0ms', async () => {
		const start = Date.now();
		await applyLatency(0);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeLessThan(50);
	});

	it('resolves immediately for negative ms', async () => {
		const start = Date.now();
		await applyLatency(-10);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeLessThan(50);
	});
});
