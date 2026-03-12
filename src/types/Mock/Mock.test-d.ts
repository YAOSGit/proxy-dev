import { assertType, describe, expectTypeOf, it } from 'vitest';
import type { MockRoute, MockVariant } from './index.js';

describe('Mock type tests', () => {
	it('MockVariant has required fields', () => {
		expectTypeOf<MockVariant>().toHaveProperty('file');
		expectTypeOf<MockVariant>().toHaveProperty('status');
	});

	it('MockRoute has variants', () => {
		expectTypeOf<MockRoute>().toHaveProperty('variants');
	});

	it('MockVariant is assignable', () => {
		assertType<MockVariant>({
			file: './mocks/api/users/success.json',
			status: 200,
		});
	});
});
