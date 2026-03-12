import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { startDaemonServer } from './server.js';
import type { DaemonServerHandle } from './server.js';
import { DaemonClient } from './client.js';

describe('DaemonClient', () => {
	let tmpDir: string;
	let socketPath: string;
	let hostsPath: string;
	let handle: DaemonServerHandle;
	let client: DaemonClient;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'daemon-client-test-'));
		socketPath = path.join(tmpDir, 'proxy-dev.sock');
		hostsPath = path.join(tmpDir, 'hosts');
		fs.writeFileSync(hostsPath, '# Test hosts file\n127.0.0.1 localhost\n', 'utf-8');

		handle = startDaemonServer({ socketPath, hostsPath });
		client = new DaemonClient(socketPath);
	});

	afterEach(async () => {
		client.close();
		await handle.stop();
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('ping() returns true when daemon is running', async () => {
		const result = await client.ping();
		expect(result).toBe(true);
	});

	it('addHost() + listHosts() works', async () => {
		await client.addHost('app.local');
		await client.addHost('api.local');

		const hosts = await client.listHosts();
		expect(hosts).toContain('app.local');
		expect(hosts).toContain('api.local');
		expect(hosts).toHaveLength(2);
	});

	it('removeHost() works', async () => {
		await client.addHost('app.local');
		await client.addHost('api.local');

		await client.removeHost('app.local');

		const hosts = await client.listHosts();
		expect(hosts).toEqual(['api.local']);
	});

	it('cleanup() works', async () => {
		await client.addHost('app.local');
		await client.addHost('api.local');

		await client.cleanup();

		const hosts = await client.listHosts();
		expect(hosts).toHaveLength(0);
	});

	it('ping() returns false when daemon is not running', async () => {
		const badClient = new DaemonClient('/tmp/nonexistent-proxy-dev-test.sock');
		const result = await badClient.ping();
		expect(result).toBe(false);
	});
});
