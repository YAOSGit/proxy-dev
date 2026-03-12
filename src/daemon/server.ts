import fs from 'node:fs';
import net from 'node:net';
import {
	addEntry,
	getProxyDevEntries,
	removeAllProxyDevEntries,
	removeEntry,
} from '../hosts/parser.js';
import type { DaemonCommand, DaemonResponse } from '../types/Ipc/index.js';

interface DaemonServerConfig {
	socketPath: string;
	hostsPath?: string;
	pidPath?: string;
}

interface DaemonServerHandle {
	stop: () => Promise<void>;
}

const handleCommand = (
	command: DaemonCommand,
	hostsPath: string,
): DaemonResponse => {
	switch (command.action) {
		case 'ping': {
			return { ok: true };
		}

		case 'add': {
			const content = fs.readFileSync(hostsPath, 'utf-8');
			const updated = addEntry(content, command.domain);
			fs.writeFileSync(hostsPath, updated, 'utf-8');
			return { ok: true };
		}

		case 'remove': {
			const content = fs.readFileSync(hostsPath, 'utf-8');
			const updated = removeEntry(content, command.domain);
			fs.writeFileSync(hostsPath, updated, 'utf-8');
			return { ok: true };
		}

		case 'cleanup': {
			const content = fs.readFileSync(hostsPath, 'utf-8');
			const updated = removeAllProxyDevEntries(content);
			fs.writeFileSync(hostsPath, updated, 'utf-8');
			return { ok: true };
		}

		case 'list': {
			const content = fs.readFileSync(hostsPath, 'utf-8');
			const domains = getProxyDevEntries(content);
			return { ok: true, domains };
		}

		default: {
			return {
				ok: false,
				error: `Unknown action: ${(command as { action: string }).action}`,
			};
		}
	}
};

const startDaemonServer = (config: DaemonServerConfig): DaemonServerHandle => {
	const hostsPath = config.hostsPath ?? '/etc/hosts';
	let stopped = false;

	// Remove stale socket file if it exists
	if (fs.existsSync(config.socketPath)) {
		fs.unlinkSync(config.socketPath);
	}

	// Write PID file
	if (config.pidPath) {
		fs.writeFileSync(config.pidPath, String(process.pid), 'utf-8');
	}

	const MAX_BUFFER_SIZE = 65536;

	const server = net.createServer((socket) => {
		let buffer = '';

		socket.on('data', (data) => {
			buffer += data.toString();

			if (buffer.length > MAX_BUFFER_SIZE) {
				socket.destroy();
				return;
			}

			let newlineIdx: number = buffer.indexOf('\n');
			while (newlineIdx !== -1) {
				const line = buffer.slice(0, newlineIdx);
				buffer = buffer.slice(newlineIdx + 1);
				newlineIdx = buffer.indexOf('\n');

				if (line.trim().length === 0) continue;

				let command: DaemonCommand;
				try {
					command = JSON.parse(line) as DaemonCommand;
				} catch {
					const errResp: DaemonResponse = { ok: false, error: 'Invalid JSON' };
					socket.write(`${JSON.stringify(errResp)}\n`);
					continue;
				}

				if (command.action === 'shutdown') {
					const resp: DaemonResponse = { ok: true };
					socket.write(`${JSON.stringify(resp)}\n`);
					// Schedule cleanup + close after writing the response
					setImmediate(() => {
						void cleanup();
					});
					continue;
				}

				let response: DaemonResponse;
				try {
					response = handleCommand(command, hostsPath);
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					response = {
						ok: false,
						error: `Command "${command.action}" failed: ${msg}`,
					};
				}
				socket.write(`${JSON.stringify(response)}\n`);
			}
		});
	});

	server.listen(config.socketPath, () => {
		// Allow non-root users to connect to the socket
		try {
			fs.chmodSync(config.socketPath, 0o666);
		} catch (err) {
			console.error(
				`[daemon] Failed to chmod socket: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	});

	const cleanup = async (): Promise<void> => {
		if (stopped) return;
		stopped = true;

		// Clean up hosts entries
		try {
			const content = fs.readFileSync(hostsPath, 'utf-8');
			const updated = removeAllProxyDevEntries(content);
			fs.writeFileSync(hostsPath, updated, 'utf-8');
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error(`[daemon] Failed to clean /etc/hosts on shutdown: ${msg}`);
			console.error(
				`[daemon] You may need to manually remove proxy-dev entries from ${hostsPath}`,
			);
		}

		// Close the server
		await new Promise<void>((resolve) => {
			server.close(() => resolve());
		});

		// Remove socket file
		try {
			fs.unlinkSync(config.socketPath);
		} catch (err) {
			if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.error(
					`[daemon] Failed to remove socket: ${(err as Error).message}`,
				);
			}
		}

		// Remove PID file
		if (config.pidPath) {
			try {
				fs.unlinkSync(config.pidPath);
			} catch (err) {
				if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
					console.error(
						`[daemon] Failed to remove PID file: ${(err as Error).message}`,
					);
				}
			}
		}
	};

	// Graceful shutdown on signals
	const onSignal = () => {
		void cleanup();
	};

	process.on('SIGTERM', onSignal);
	process.on('SIGINT', onSignal);
	process.on('uncaughtException', (err) => {
		console.error(`[daemon] Uncaught exception, cleaning up: ${err.message}`);
		void cleanup().then(() => process.exit(1));
	});
	process.on('unhandledRejection', (reason) => {
		const msg = reason instanceof Error ? reason.message : String(reason);
		console.error(`[daemon] Unhandled rejection, cleaning up: ${msg}`);
		void cleanup().then(() => process.exit(1));
	});

	return {
		stop: async () => {
			process.off('SIGTERM', onSignal);
			process.off('SIGINT', onSignal);
			await cleanup();
		},
	};
};

export { startDaemonServer };
export type { DaemonServerConfig, DaemonServerHandle };
