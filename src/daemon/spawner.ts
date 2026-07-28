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

	// Two-stage spawn. sudo itself must NOT be detached (it reads the password from
	// the controlling terminal, which a new session lacks) — but the daemon must NOT
	// keep that terminal (a non-detached daemon dies of SIGHUP when the terminal that
	// ran `daemon start` closes). So sudo runs a tiny root bootstrap on the tty, and
	// the bootstrap — already root, no prompt needed — spawns the real daemon detached
	// into its own session, then exits.
	const bootstrap =
		"require('node:child_process').spawn(process.argv[1], [process.argv[2]], { detached: true, stdio: 'ignore', env: process.env }).unref();";
	const child = spawn(
		'sudo',
		[
			'--preserve-env=PROXY_DEV_SOCKET',
			process.execPath,
			'-e',
			bootstrap,
			process.execPath,
			daemonScriptPath,
		],
		{
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
