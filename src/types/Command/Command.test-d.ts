import { describe, expectTypeOf, it } from 'vitest';
import type { Command } from './index.js';

describe('Command type tests', () => {
	it('Command has required fields', () => {
		expectTypeOf<Command>().toHaveProperty('id');
		expectTypeOf<Command>().toHaveProperty('keys');
		expectTypeOf<Command>().toHaveProperty('execute');
		expectTypeOf<Command>().toHaveProperty('isEnabled');
	});

	it('Command execute is a function', () => {
		expectTypeOf<Command['execute']>().toEqualTypeOf<() => void>();
	});
});
