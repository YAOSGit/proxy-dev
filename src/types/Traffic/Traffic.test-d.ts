import { describe, expectTypeOf, it } from 'vitest';
import type { TrafficEntry } from './index.js';

describe('Traffic type tests', () => {
	it('TrafficEntry has required fields', () => {
		expectTypeOf<TrafficEntry>().toHaveProperty('id');
		expectTypeOf<TrafficEntry>().toHaveProperty('method');
		expectTypeOf<TrafficEntry>().toHaveProperty('domain');
		expectTypeOf<TrafficEntry>().toHaveProperty('status');
		expectTypeOf<TrafficEntry>().toHaveProperty('latencyMs');
		expectTypeOf<TrafficEntry>().toHaveProperty('routeState');
	});

	it('routeState is LIVE or MOCK', () => {
		expectTypeOf<TrafficEntry['routeState']>().toEqualTypeOf<'LIVE' | 'MOCK'>();
	});
});
