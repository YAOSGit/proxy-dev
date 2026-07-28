import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { DaemonClient } from './client.js';

const isDaemonRunning = async (socketPath: string): Promise<boolean> => {
	if (!fs.existsSync(socketPath)) {
		return false;
	}

	const client = new DaemonClient(socketPath);
	try {
		return await client.ping();
	} catch {
		return false;
	}
};

const cleanStaleDaemon = (socketPath: string, pidPath: string): void => {
	try {
		if (fs.existsSync(socketPath)) {
			fs.unlinkSync(socketPath);
		}
	} catch {
		// ignore
	}

	try {
		if (fs.existsSync(pidPath)) {
			fs.unlinkSync(pidPath);
		}
	} catch {
		// ignore
	}
};

const waitForSocket = async (
	socketPath: string,
	timeoutMs = 3000,
): Promise<boolean> => {
	const start = Date.now();

	while (Date.now() - start < timeoutMs) {
		if (fs.existsSync(socketPath)) {
			const client = new DaemonClient(socketPath);
			try {
				const ok = await client.ping();
				if (ok) return true;
			} catch {
				// not ready yet
			}
		}

		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	return false;
};

const spawnDaemon = async (
	daemonScriptPath: string,
	socketPath: string,
	pidPath: string,
): Promise<boolean> => {
	if (await isDaemonRunning(socketPath)) {
		return true;
	}

	cleanStaleDaemon(socketPath, pidPath);

	const child = spawn(
		'sudo',
		['--preserve-env=PROXY_DEV_SOCKET', process.execPath, daemonScriptPath],
		{
			// NOT detached: sudo reads the password from the controlling terminal
			// (/dev/tty), which a detached (new-session) child does not have. The
			// daemon still outlives us — once this command exits, its process group
			// is no longer the foreground group, so a later Ctrl+C never reaches it.
			// (The old danger window was the post-success hang below.)
			stdio: ['ignore', 'ignore', 'pipe'],
			env: { ...process.env, PROXY_DEV_SOCKET: socketPath },
		},
	);

	let stderr = '';
	child.stderr?.on('data', (data: Buffer) => {
		stderr += data.toString();
	});

	child.on('error', (err) => {
		console.error(`[daemon] Spawn failed: ${err.message}`);
	});

	child.on('exit', (code) => {
		if (code !== null && code !== 0) {
			console.error(`[daemon] Exited with code ${code}`);
			if (stderr) console.error(`[daemon] ${stderr.trim()}`);
		}
	});

	const ok = await waitForSocket(socketPath);

	// Release every handle tying the daemon to this process. The stderr pipe is the
	// subtle one: unref() alone does not cover open stdio pipes, and that kept the
	// event loop alive — `daemon start` printed success and then hung the terminal.
	child.stderr?.destroy();
	child.unref();

	return ok;
};

export { cleanStaleDaemon, isDaemonRunning, spawnDaemon, waitForSocket };
