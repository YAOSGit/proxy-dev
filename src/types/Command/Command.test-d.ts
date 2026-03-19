import { describe, expectTypeOf, it } from 'vitest';
import type { ProxyDevCommand, ProxyDevDeps } from '../../commands/types.js';

describe('Command type tests', () => {
	it('ProxyDevCommand has required fields', () => {
		expectTypeOf<ProxyDevCommand>().toHaveProperty('id');
		expectTypeOf<ProxyDevCommand>().toHaveProperty('keys');
		expectTypeOf<ProxyDevCommand>().toHaveProperty('execute');
		expectTypeOf<ProxyDevCommand>().toHaveProperty('isEnabled');
	});

	it('ProxyDevCommand execute accepts deps', () => {
		expectTypeOf<ProxyDevCommand['execute']>().toEqualTypeOf<
			(deps: ProxyDevDeps) => void
		>();
	});
});
