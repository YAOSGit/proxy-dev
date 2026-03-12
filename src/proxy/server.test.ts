import { describe, expect, it } from 'vitest';
import { matchRoute } from './interceptor.js';
import { resolveLatency } from './latency.js';

// Server integration tests - test the logic units that compose the server
describe('proxy server logic', () => {
	describe('route matching with mock routing', () => {
		it('selects route with mock variant when available', () => {
			const routes = [
				{
					domain: 'api.local',
					target: 3000,
					mockRoute: {
						variants: {
							success: { file: './mocks/api/success.json', status: 200 },
						},
						active: 'success',
					},
				},
			];
			const match = matchRoute('api.local', '/users', routes);
			expect(match).not.toBeNull();
			expect(match?.mockRoute?.active).toBe('success');
		});

		it('returns null for unmatched domain', () => {
			const routes = [{ domain: 'api.local', target: 3000 }];
			const match = matchRoute('other.local', '/users', routes);
			expect(match).toBeNull();
		});
	});

	describe('latency injection in server context', () => {
		it('applies mock variant latency when route is mocked', () => {
			const latency = resolveLatency(50, { globalMs: 0 }, 200);
			expect(latency).toBe(200);
		});

		it('applies zero latency when none configured', () => {
			const latency = resolveLatency(undefined, { globalMs: 0 });
			expect(latency).toBe(0);
		});
	});
});
