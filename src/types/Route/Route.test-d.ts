import { assertType, describe, expectTypeOf, it } from 'vitest';
import type { Route, RouteGroup } from './index.js';

describe('Route type tests', () => {
	it('Route has required domain and target', () => {
		expectTypeOf<Route>().toHaveProperty('domain');
		expectTypeOf<Route>().toHaveProperty('target');
	});

	it('Route path is optional', () => {
		assertType<Route>({ domain: 'api.local', target: 3000 });
	});

	it('RouteGroup has routes array', () => {
		expectTypeOf<RouteGroup>().toHaveProperty('routes');
	});
});
