import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const createTestServer = (
	handler: (req: http.IncomingMessage, res: http.ServerResponse) => void,
): { server: http.Server; port: number; close: () => Promise<void> } => {
	const server = http.createServer(handler);
	let port = 0;
	server.listen(0); // pick random port
	port = (server.address() as { port: number }).port;

	const close = () =>
		new Promise<void>((resolve, reject) => {
			server.close((err) => (err ? reject(err) : resolve()));
		});

	return { server, port, close };
};

const createTempDir = (): { dir: string; cleanup: () => void } => {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-e2e-'));
	const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });
	return { dir, cleanup };
};

const runCLI = (args: string[], env?: Record<string, string>): string => {
	const distCli = path.resolve(process.cwd(), 'dist/cli.js');
	try {
		return execFileSync(process.execPath, [distCli, ...args], {
			encoding: 'utf-8',
			env: { ...process.env, ...env },
		});
	} catch (e: unknown) {
		if (e && typeof e === 'object' && 'stdout' in e) {
			return (e as { stdout: string }).stdout || '';
		}
		return '';
	}
};

export { createTestServer, createTempDir, runCLI };
