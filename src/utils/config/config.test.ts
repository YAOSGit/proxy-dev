import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { GlobalConfig, LocalConfig } from '../../types/Config/index.js';
import {
    bootstrapGlobalConfig,
    loadConfigByMode,
    loadGlobalConfig,
    loadLocalConfig,
    mergeConfigs,
    resolveRoutes,
    saveGlobalConfig,
    validateGlobalConfig,
    validateLocalConfig,
} from './index.js';

describe('config', () => {
    let tmpDir: string;
    let origXdg: string | undefined;
    let origCwd: ReturnType<typeof process.cwd>;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-config-'));
        origXdg = process.env.XDG_CONFIG_HOME;
        process.env.XDG_CONFIG_HOME = tmpDir;
        origCwd = process.cwd();
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        if (origXdg === undefined) {
            delete process.env.XDG_CONFIG_HOME;
        } else {
            process.env.XDG_CONFIG_HOME = origXdg;
        }
        process.chdir(origCwd);
    });

    describe('validateGlobalConfig', () => {
        it('validates a valid global config', () => {
            const config = validateGlobalConfig({
                version: 1,
                port: 443,
                groups: {},
                latency: { globalMs: 0 },
            });
            expect(config.version).toBe(1);
            expect(config.port).toBe(443);
        });

        it('applies defaults for missing optional fields', () => {
            const config = validateGlobalConfig({});
            expect(config.version).toBe(1);
            expect(config.port).toBe(443);
            expect(config.latency.globalMs).toBe(0);
        });

        it('rejects invalid port', () => {
            expect(() => validateGlobalConfig({ port: 99999 })).toThrow();
        });
    });

    describe('validateLocalConfig', () => {
        it('validates a valid local config', () => {
            const config = validateLocalConfig({ mocks: {} });
            expect(config.mocks).toEqual({});
        });

        it('applies defaults', () => {
            const config = validateLocalConfig({});
            expect(config.mocks).toEqual({});
        });
    });

    describe('loadGlobalConfig', () => {
        it('returns default config if file does not exist', () => {
            const config = loadGlobalConfig();
            expect(config.version).toBe(1);
            expect(config.port).toBe(443);
        });

        it('loads existing config', () => {
            const configDir = path.join(tmpDir, 'proxy-dev');
            fs.mkdirSync(configDir, { recursive: true });
            fs.writeFileSync(
                path.join(configDir, 'config.json'),
                JSON.stringify({ version: 1, port: 8080, groups: {}, latency: { globalMs: 100 } }),
            );
            const config = loadGlobalConfig();
            expect(config.port).toBe(8080);
            expect(config.latency.globalMs).toBe(100);
        });
    });

    describe('loadLocalConfig', () => {
        it('returns null if file does not exist', () => {
            const config = loadLocalConfig(tmpDir);
            expect(config).toBeNull();
        });

        it('loads existing local config', () => {
            fs.writeFileSync(
                path.join(tmpDir, 'proxy-dev.json'),
                JSON.stringify({ mocks: {}, activeGroups: ['web'] }),
            );
            const config = loadLocalConfig(tmpDir);
            expect(config).not.toBeNull();
            expect(config?.activeGroups).toEqual(['web']);
        });
    });

    describe('saveGlobalConfig', () => {
        it('saves config atomically', () => {
            const cfg: GlobalConfig = { version: 1, port: 3000, groups: {}, latency: { globalMs: 50 } };
            saveGlobalConfig(cfg);
            const loaded = loadGlobalConfig();
            expect(loaded.port).toBe(3000);
        });
    });

    describe('bootstrapGlobalConfig', () => {
        it('creates starter config if not exists', () => {
            bootstrapGlobalConfig();
            const loaded = loadGlobalConfig();
            expect(loaded.version).toBe(1);
        });

        it('does not overwrite existing config', () => {
            const cfg: GlobalConfig = { version: 1, port: 9999, groups: {}, latency: { globalMs: 0 } };
            saveGlobalConfig(cfg);
            bootstrapGlobalConfig();
            const loaded = loadGlobalConfig();
            expect(loaded.port).toBe(9999);
        });
    });

    describe('resolveRoutes', () => {
        it('returns all routes when no activeGroups filter', () => {
            const global: GlobalConfig = {
                version: 1,
                port: 443,
                groups: {
                    web: { routes: [{ domain: 'web.local', target: 3000 }] },
                    api: { routes: [{ domain: 'api.local', target: 4000 }] },
                },
                latency: { globalMs: 0 },
            };
            const routes = resolveRoutes(global, null);
            expect(routes).toHaveLength(2);
        });

        it('filters routes by activeGroups', () => {
            const global: GlobalConfig = {
                version: 1,
                port: 443,
                groups: {
                    web: { routes: [{ domain: 'web.local', target: 3000 }] },
                    api: { routes: [{ domain: 'api.local', target: 4000 }] },
                },
                latency: { globalMs: 0 },
            };
            const local: LocalConfig = { mocks: {}, activeGroups: ['api'] };
            const routes = resolveRoutes(global, local);
            expect(routes).toHaveLength(1);
            expect(routes[0]?.domain).toBe('api.local');
        });
    });

    describe('mergeConfigs', () => {
        it('uses local latency over global when present', () => {
            const global: GlobalConfig = {
                version: 1,
                port: 443,
                groups: {},
                latency: { globalMs: 0 },
            };
            const local: LocalConfig = { mocks: {}, latency: { globalMs: 500 } };
            const resolved = mergeConfigs(global, local);
            expect(resolved.latency.globalMs).toBe(500);
        });

        it('uses global latency when no local', () => {
            const global: GlobalConfig = {
                version: 1,
                port: 443,
                groups: {},
                latency: { globalMs: 200 },
            };
            const resolved = mergeConfigs(global, null);
            expect(resolved.latency.globalMs).toBe(200);
        });
    });

    describe('loadConfigByMode', () => {
        it('mode=global returns only global groups untagged', () => {
            const configDir = path.join(tmpDir, 'proxy-dev');
            fs.mkdirSync(configDir, { recursive: true });
            fs.writeFileSync(
                path.join(configDir, 'config.json'),
                JSON.stringify({
                    version: 1, port: 443,
                    groups: { api: { routes: [{ domain: 'api.local', target: 3000 }] } },
                    latency: { globalMs: 0 },
                }),
            );
            const result = loadConfigByMode('global');
            expect(Object.keys(result.groups)).toEqual(['api']);
            expect(result.groups['api']!.source).toBe('global');
            expect(result.groups['api']!.originalName).toBe('api');
        });

        it('mode=local bootstraps empty config if missing', () => {
            process.chdir(tmpDir);
            const result = loadConfigByMode('local');
            expect(Object.keys(result.groups)).toEqual([]);
            expect(fs.existsSync(path.join(tmpDir, 'proxy-dev.json'))).toBe(true);
        });

        it('mode=local loads local groups untagged', () => {
            process.chdir(tmpDir);
            fs.writeFileSync(
                path.join(tmpDir, 'proxy-dev.json'),
                JSON.stringify({
                    mocks: {},
                    groups: { dev: { routes: [{ domain: 'dev.local', target: 4000 }] } },
                }),
            );
            const result = loadConfigByMode('local');
            expect(result.groups['dev']!.source).toBe('local');
            expect(result.groups['dev']!.originalName).toBe('dev');
        });

        it('mode=merged prefixes groups with source', () => {
            const configDir = path.join(tmpDir, 'proxy-dev');
            fs.mkdirSync(configDir, { recursive: true });
            fs.writeFileSync(
                path.join(configDir, 'config.json'),
                JSON.stringify({
                    version: 1, port: 443,
                    groups: { api: { routes: [{ domain: 'api.local', target: 3000 }] } },
                    latency: { globalMs: 0 },
                }),
            );
            process.chdir(tmpDir);
            fs.writeFileSync(
                path.join(tmpDir, 'proxy-dev.json'),
                JSON.stringify({
                    mocks: {},
                    groups: { api: { routes: [{ domain: 'api-dev.local', target: 4000 }] } },
                }),
            );
            const result = loadConfigByMode('merged');
            expect(result.groups['global:api']).toBeDefined();
            expect(result.groups['local:api']).toBeDefined();
            expect(result.groups['global:api']!.source).toBe('global');
            expect(result.groups['local:api']!.source).toBe('local');
        });

        it('mode=merged with no local config only shows global groups', () => {
            const configDir = path.join(tmpDir, 'proxy-dev');
            fs.mkdirSync(configDir, { recursive: true });
            fs.writeFileSync(
                path.join(configDir, 'config.json'),
                JSON.stringify({
                    version: 1, port: 443,
                    groups: { web: { routes: [{ domain: 'web.local', target: 3000 }] } },
                    latency: { globalMs: 0 },
                }),
            );
            process.chdir(tmpDir);
            const result = loadConfigByMode('merged');
            expect(Object.keys(result.groups)).toEqual(['global:web']);
        });
    });
});
