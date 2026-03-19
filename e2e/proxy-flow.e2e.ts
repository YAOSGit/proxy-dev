// NOTE: This is an integration test — it exercises internal proxy/config APIs
// (matchRoute, resolveLatency, mergeConfigs, etc.) rather than invoking the
// CLI binary. For CLI-level route tests see routes.e2e.ts.
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { matchRoute } from '../src/proxy/interceptor.js';
import { resolveLatency } from '../src/proxy/latency.js';
import {
	bootstrapGlobalConfig,
	loadGlobalConfig,
	mergeConfigs,
	saveGlobalConfig,
} from '../src/utils/config/index.js';
import { createTempDir } from './utils/index.js';

describe('proxy flow E2E (integration)', () => {
	let tmpDir: string;
	let cleanup: () => void;
	let origXdg: string | undefined;

	beforeEach(() => {
		const tmp = createTempDir();
		tmpDir = tmp.dir;
		cleanup = tmp.cleanup;
		origXdg = process.env.XDG_CONFIG_HOME;
		process.env.XDG_CONFIG_HOME = tmpDir;
	});

	afterEach(() => {
		cleanup();
		if (origXdg === undefined) {
			delete process.env.XDG_CONFIG_HOME;
		} else {
			process.env.XDG_CONFIG_HOME = origXdg;
		}
	});

	it('route matching works end-to-end with real config', () => {
		const global = {
			version: 1,
			port: 443,
			groups: {
				api: {
					routes: [
						{ domain: 'api.local', path: '/users', target: 3001 },
						{ domain: 'api.local', target: 3000 },
					],
				},
			},
			latency: { globalMs: 0 },
		};

		const routes = global.groups.api.routes;
		const match = matchRoute('api.local', '/users/123', routes);
		expect(match?.target).toBe(3001);

		const match2 = matchRoute('api.local', '/orders', routes);
		expect(match2?.target).toBe(3000);
	});

	it('latency resolves correctly in a full flow', () => {
		const latency = resolveLatency(50, { globalMs: 0 }, 200);
		expect(latency).toBe(200);

		const latencyFallback = resolveLatency(undefined, { globalMs: 100 });
		expect(latencyFallback).toBe(100);
	});

	it('config merge produces correct resolved routes', async () => {
		bootstrapGlobalConfig();

		const global = loadGlobalConfig();
		global.groups.test = {
			routes: [{ domain: 'test.local', target: 9999 }],
		};
		saveGlobalConfig(global);

		const reloaded = loadGlobalConfig();
		const resolved = mergeConfigs(reloaded, null);
		expect(resolved.routes.some((r) => r.domain === 'test.local')).toBe(true);
	});
});
