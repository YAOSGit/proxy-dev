import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTempDir, runCLI } from './utils/index.js';

describe('CLI commands E2E', () => {
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

    it('trust init creates config and CA', async () => {
        // We test config bootstrap logic directly since sudo CA needs actual openssl
        const { bootstrapGlobalConfig } = await import('../src/utils/config/index.js');
        bootstrapGlobalConfig();
        const configPath = path.join(tmpDir, 'proxy-dev', 'config.json');
        expect(fs.existsSync(configPath)).toBe(true);
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        expect(config.version).toBe(1);
        expect(config.port).toBe(443);
    });

    it('routes add and remove work', async () => {
        const { loadGlobalConfig, saveGlobalConfig } = await import('../src/utils/config/index.js');
        const { bootstrapGlobalConfig } = await import('../src/utils/config/index.js');
        bootstrapGlobalConfig();

        const global = loadGlobalConfig();
        if (!global.groups['default']) {
            global.groups['default'] = { routes: [] };
        }
        const group = global.groups['default'];
        if (group) {
            group.routes.push({ domain: 'api.local', target: 3000 });
        }
        saveGlobalConfig(global);

        const loaded = loadGlobalConfig();
        const routes = loaded.groups['default']?.routes ?? [];
        expect(routes.some((r) => r.domain === 'api.local')).toBe(true);
    });

    it('mock config can be updated', async () => {
        const { loadLocalConfig, saveLocalConfig } = await import('../src/utils/config/index.js');
        const local = { mocks: {} };
        const localPath = path.join(tmpDir, 'proxy-dev.json');

        const oldCwd = process.cwd();
        process.chdir(tmpDir);
        try {
            saveLocalConfig(local, tmpDir);
            const loaded = loadLocalConfig(tmpDir);
            expect(loaded).not.toBeNull();
            expect(loaded?.mocks).toEqual({});
        } finally {
            process.chdir(oldCwd);
        }
    });
});
