import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DaemonCommand, DaemonResponse } from '../types/Ipc/index.js';
import { startDaemonServer } from './server.js';
import type { DaemonServerHandle } from './server.js';

const sendCommand = (socketPath: string, command: DaemonCommand): Promise<DaemonResponse> => {
	return new Promise((resolve, reject) => {
		const client = net.createConnection(socketPath, () => {
			client.write(JSON.stringify(command) + '\n');
		});

		let buffer = '';
		client.on('data', (data) => {
			buffer += data.toString();
			const newlineIdx = buffer.indexOf('\n');
			if (newlineIdx !== -1) {
				const line = buffer.slice(0, newlineIdx);
				client.end();
				try {
					resolve(JSON.parse(line) as DaemonResponse);
				} catch (err) {
					reject(err);
				}
			}
		});

		client.on('error', reject);
	});
};

describe('daemon server', () => {
	let tmpDir: string;
	let socketPath: string;
	let hostsPath: string;
	let pidPath: string;
	let handle: DaemonServerHandle | null;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-daemon-'));
		socketPath = path.join(tmpDir, 'daemon.sock');
		hostsPath = path.join(tmpDir, 'hosts');
		pidPath = path.join(tmpDir, 'daemon.pid');

		// Create a fake hosts file
		fs.writeFileSync(hostsPath, '127.0.0.1 localhost\n::1 localhost\n', 'utf-8');

		handle = null;
	});

	afterEach(async () => {
		if (handle) {
			await handle.stop();
			handle = null;
		}
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const startServer = (): DaemonServerHandle => {
		handle = startDaemonServer({ socketPath, hostsPath, pidPath });
		return handle;
	};

	it('responds to ping with { ok: true }', async () => {
		startServer();

		const response = await sendCommand(socketPath, { action: 'ping' });
		expect(response).toEqual({ ok: true });
	});

	it('writes PID file on startup', () => {
		startServer();

		expect(fs.existsSync(pidPath)).toBe(true);
		const pid = fs.readFileSync(pidPath, 'utf-8');
		expect(Number(pid)).toBe(process.pid);
	});

	it('removes stale socket file before listening', () => {
		// Create a stale socket file
		fs.writeFileSync(socketPath, 'stale');
		startServer();

		// Server should still be listening (the stale file was removed)
		expect(fs.existsSync(socketPath)).toBe(true);
	});

	it('adds and lists host entries', async () => {
		startServer();

		const addResp1 = await sendCommand(socketPath, { action: 'add', domain: 'app.local' });
		expect(addResp1).toEqual({ ok: true });

		const addResp2 = await sendCommand(socketPath, { action: 'add', domain: 'api.local' });
		expect(addResp2).toEqual({ ok: true });

		const listResp = await sendCommand(socketPath, { action: 'list' });
		expect(listResp.ok).toBe(true);
		expect('domains' in listResp && listResp.domains).toEqual(
			expect.arrayContaining(['app.local', 'api.local']),
		);

		// Verify the hosts file was actually written
		const content = fs.readFileSync(hostsPath, 'utf-8');
		expect(content).toContain('127.0.0.1 app.local # proxy-dev managed');
		expect(content).toContain('127.0.0.1 api.local # proxy-dev managed');
	});

	it('does not duplicate existing entries', async () => {
		startServer();

		await sendCommand(socketPath, { action: 'add', domain: 'app.local' });
		await sendCommand(socketPath, { action: 'add', domain: 'app.local' });

		const content = fs.readFileSync(hostsPath, 'utf-8');
		const matches = content.match(/app\.local/g);
		expect(matches).toHaveLength(1);
	});

	it('removes host entries', async () => {
		startServer();

		await sendCommand(socketPath, { action: 'add', domain: 'app.local' });
		await sendCommand(socketPath, { action: 'add', domain: 'api.local' });

		const removeResp = await sendCommand(socketPath, { action: 'remove', domain: 'app.local' });
		expect(removeResp).toEqual({ ok: true });

		const listResp = await sendCommand(socketPath, { action: 'list' });
		expect(listResp.ok).toBe(true);
		expect('domains' in listResp && listResp.domains).toEqual(['api.local']);
	});

	it('cleans up all proxy-dev entries', async () => {
		startServer();

		await sendCommand(socketPath, { action: 'add', domain: 'app.local' });
		await sendCommand(socketPath, { action: 'add', domain: 'api.local' });
		await sendCommand(socketPath, { action: 'add', domain: 'web.local' });

		const cleanupResp = await sendCommand(socketPath, { action: 'cleanup' });
		expect(cleanupResp).toEqual({ ok: true });

		const listResp = await sendCommand(socketPath, { action: 'list' });
		expect(listResp.ok).toBe(true);
		expect('domains' in listResp && listResp.domains).toEqual([]);

		// Original entries should still be present
		const content = fs.readFileSync(hostsPath, 'utf-8');
		expect(content).toContain('127.0.0.1 localhost');
	});

	it('shuts down on shutdown command', async () => {
		startServer();

		const shutdownResp = await sendCommand(socketPath, { action: 'shutdown' });
		expect(shutdownResp).toEqual({ ok: true });

		// Wait a bit for the server to fully close
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Socket should no longer accept connections
		await expect(
			sendCommand(socketPath, { action: 'ping' }),
		).rejects.toThrow();

		// After shutdown, set handle to null so afterEach doesn't double-stop
		handle = null;
	});

	it('cleans up hosts entries on stop', async () => {
		startServer();

		await sendCommand(socketPath, { action: 'add', domain: 'app.local' });
		await sendCommand(socketPath, { action: 'add', domain: 'api.local' });

		await handle!.stop();
		handle = null;

		const content = fs.readFileSync(hostsPath, 'utf-8');
		expect(content).not.toContain('# proxy-dev managed');
		expect(content).toContain('127.0.0.1 localhost');
	});

	it('removes PID file on stop', async () => {
		startServer();

		expect(fs.existsSync(pidPath)).toBe(true);

		await handle!.stop();
		handle = null;

		expect(fs.existsSync(pidPath)).toBe(false);
	});
});
