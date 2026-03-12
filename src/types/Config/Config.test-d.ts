import { assertType, describe, expectTypeOf, it } from 'vitest';
import type {
	ConfigMode,
	ConfigSource,
	GlobalConfig,
	LocalConfig,
	TaggedRouteGroup,
} from './index.js';

describe('Config type tests', () => {
	it('GlobalConfig has required fields', () => {
		expectTypeOf<GlobalConfig>().toHaveProperty('version');
		expectTypeOf<GlobalConfig>().toHaveProperty('port');
		expectTypeOf<GlobalConfig>().toHaveProperty('groups');
		expectTypeOf<GlobalConfig>().toHaveProperty('latency');
	});

	it('LocalConfig mocks keyed by string', () => {
		expectTypeOf<LocalConfig>().toHaveProperty('mocks');
	});

	it('GlobalConfig is assignable with valid data', () => {
		assertType<GlobalConfig>({
			version: 1,
			port: 443,
			groups: {},
			latency: { globalMs: 0 },
		});
	});

	it('LocalConfig is assignable with valid data', () => {
		assertType<LocalConfig>({
			mocks: {},
		});
	});

	it('ConfigMode is a union of local, global, merged', () => {
		expectTypeOf<ConfigMode>().toEqualTypeOf<'local' | 'global' | 'merged'>();
	});

	it('ConfigSource is a union of local, global', () => {
		expectTypeOf<ConfigSource>().toEqualTypeOf<'local' | 'global'>();
	});

	it('TaggedRouteGroup has source, originalName, and routes', () => {
		expectTypeOf<TaggedRouteGroup>().toHaveProperty('source');
		expectTypeOf<TaggedRouteGroup>().toHaveProperty('originalName');
		expectTypeOf<TaggedRouteGroup>().toHaveProperty('routes');
	});
});
