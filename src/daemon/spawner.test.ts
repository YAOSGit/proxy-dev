import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect, afterEach } from 'vitest';
import { startDaemonServer } from './server.js';
import { isDaemonRunning, cleanStaleDaemon } from './spawner.js';
import type { DaemonServerHandle } from './server.js';

describe('spawner', () => {
	let tmpDir: string;
	let handle: DaemonServerHandle | undefined;

	const makeTmpDir = (): string => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-spawner-'));
		return dir;
	};

	afterEach(async () => {
		if (handle) {
			await handle.stop();
			handle = undefined;
		}
		if (tmpDir) {
			fs.rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	describe('isDaemonRunning', () => {
		it('returns false when no socket exists', async () => {
			tmpDir = makeTmpDir();
			const socketPath = path.join(tmpDir, 'daemon.sock');

			const result = await isDaemonRunning(socketPath);

			expect(result).toBe(false);
		});

		it('returns true when daemon is running', async () => {
			tmpDir = makeTmpDir();
			const socketPath = path.join(tmpDir, 'daemon.sock');
			const hostsPath = path.join(tmpDir, 'hosts');
			fs.writeFileSync(hostsPath, '', 'utf-8');

			handle = startDaemonServer({
				socketPath,
				hostsPath,
			});

			// Give server a moment to start listening
			await new Promise((resolve) => setTimeout(resolve, 100));

			const result = await isDaemonRunning(socketPath);

			expect(result).toBe(true);
		});
	});

	describe('cleanStaleDaemon', () => {
		it('removes stale socket and pid files', () => {
			tmpDir = makeTmpDir();
			const socketPath = path.join(tmpDir, 'daemon.sock');
			const pidPath = path.join(tmpDir, 'daemon.pid');

			fs.writeFileSync(socketPath, '', 'utf-8');
			fs.writeFileSync(pidPath, '12345', 'utf-8');

			expect(fs.existsSync(socketPath)).toBe(true);
			expect(fs.existsSync(pidPath)).toBe(true);

			cleanStaleDaemon(socketPath, pidPath);

			expect(fs.existsSync(socketPath)).toBe(false);
			expect(fs.existsSync(pidPath)).toBe(false);
		});

		it('does not throw when files do not exist', () => {
			tmpDir = makeTmpDir();
			const socketPath = path.join(tmpDir, 'nonexistent.sock');
			const pidPath = path.join(tmpDir, 'nonexistent.pid');

			expect(() => cleanStaleDaemon(socketPath, pidPath)).not.toThrow();
		});
	});
});
