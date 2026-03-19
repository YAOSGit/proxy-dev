import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import {
	addEntry,
	getProxyDevEntries,
	removeAllProxyDevEntries,
	removeEntry,
} from '../hosts/parser.js';
import type { DaemonCommand, DaemonResponse } from '../types/Ipc/index.js';

type DaemonServerConfig = {
	socketPath: string;
	hostsPath?: string;
	pidPath?: string;
};

type DaemonServerHandle = {
	stop: () => Promise<void>;
};

/**
 * Extract the SNI hostname from a raw TLS ClientHello buffer.
 * Peeks at the first data chunk without decrypting — the daemon never
 * terminates TLS; it reads only the unencrypted handshake header.
 */
const extractSNI = (buf: Buffer): string | null => {
	let offset = 0;

	// TLS record header: content type (1) + version (2) + length (2)
	if (buf.length < 5 || buf[0] !== 0x16) return null;
	offset = 5;

	// Handshake header: type (1) + length (3)
	if (buf.length < offset + 4 || buf[offset] !== 0x01) return null;
	offset += 4;

	// ClientHello: version (2) + random (32)
	if (buf.length < offset + 34) return null;
	offset += 34;

	// Session ID
	if (buf.length < offset + 1) return null;
	offset += 1 + (buf[offset] ?? 0);

	// Cipher suites
	if (buf.length < offset + 2) return null;
	offset += 2 + buf.readUInt16BE(offset);

	// Compression methods
	if (buf.length < offset + 1) return null;
	offset += 1 + (buf[offset] ?? 0);

	// Extensions total length
	if (buf.length < offset + 2) return null;
	const extensionsEnd = offset + 2 + buf.readUInt16BE(offset);
	offset += 2;

	while (offset + 4 <= extensionsEnd && offset + 4 <= buf.length) {
		const extType = buf.readUInt16BE(offset);
		const extLen = buf.readUInt16BE(offset + 2);
		offset += 4;

		if (extType === 0x0000) {
			// server_name extension
			if (buf.length < offset + 2) return null;
			let nameOffset = offset + 2; // skip list length
			const listEnd = nameOffset + buf.readUInt16BE(offset);
			while (nameOffset + 3 <= listEnd && nameOffset + 3 <= buf.length) {
				const nameLen = buf.readUInt16BE(nameOffset + 1);
				if (buf[nameOffset] === 0x00 && nameOffset + 3 + nameLen <= buf.length) {
					return buf.subarray(nameOffset + 3, nameOffset + 3 + nameLen).toString('ascii');
				}
				nameOffset += 3 + nameLen;
			}
			return null;
		}

		offset += extLen;
	}

	return null;
};

/** Domain → internal proxy port registry, populated via register/unregister IPC. */
const routeRegistry = new Map<string, number>();

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
			routeRegistry.clear();
			return { ok: true };
		}

		case 'list': {
			const content = fs.readFileSync(hostsPath, 'utf-8');
			const domains = getProxyDevEntries(content);
			return { ok: true, domains };
		}

		case 'register': {
			routeRegistry.set(command.domain, command.port);
			return { ok: true };
		}

		case 'unregister': {
			routeRegistry.delete(command.domain);
			return { ok: true };
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

	// === SNI TCP router on port 443 ===
	// Reads the first TLS ClientHello chunk, extracts the SNI hostname, then
	// forwards the raw TCP stream to the registered proxy instance — no TLS
	// termination happens here.
	const tcpRouter = net.createServer((clientSocket) => {
		const onFirstChunk = (data: Buffer) => {
			const sni = extractSNI(data);
			const backendPort = sni ? routeRegistry.get(sni) : undefined;

			if (!backendPort) {
				clientSocket.destroy();
				return;
			}

			const backendSocket = new net.Socket();

			const destroy = () => {
				clientSocket.destroy();
				backendSocket.destroy();
			};
			backendSocket.on('error', destroy);
			clientSocket.on('error', destroy);

			backendSocket.connect(backendPort, '127.0.0.1', () => {
				backendSocket.write(data); // replay the ClientHello to the backend
				clientSocket.pipe(backendSocket);
				backendSocket.pipe(clientSocket);
			});
		};

		clientSocket.once('data', onFirstChunk);
		clientSocket.on('error', () => clientSocket.destroy());
	});

	tcpRouter.listen(443, '0.0.0.0', () => {
		// Listening
	});

	tcpRouter.on('error', (err) => {
		console.error(`[daemon] TCP router error: ${err.message}`);
	});

	// === HTTP redirect server on port 80 ===
	// All HTTP traffic is redirected to HTTPS; the SNI router on 443 handles
	// routing to the right proxy instance from there.
	const httpRedirect = http.createServer((req, res) => {
		const host = req.headers.host ?? '';
		res.writeHead(301, { Location: `https://${host}${req.url ?? '/'}` });
		res.end();
	});

	httpRedirect.listen(80, '0.0.0.0');

	httpRedirect.on('error', (err) => {
		console.error(`[daemon] HTTP redirect error: ${err.message}`);
	});

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

		routeRegistry.clear();

		// Close all servers
		await Promise.all([
			new Promise<void>((resolve) => { server.close(() => resolve()); }),
			new Promise<void>((resolve) => { tcpRouter.close(() => resolve()); }),
			new Promise<void>((resolve) => { httpRedirect.close(() => resolve()); }),
		]);

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
