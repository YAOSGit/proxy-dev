#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { startDaemonServer } from './server.js';

const configDir = process.env.XDG_CONFIG_HOME
	? path.join(process.env.XDG_CONFIG_HOME, 'proxy-dev')
	: path.join(os.homedir(), '.config', 'proxy-dev');

const socketPath =
	process.env.PROXY_DEV_SOCKET ?? path.join(configDir, 'daemon.sock');
const pidPath = path.join(configDir, 'daemon.pid');

const hostsPath =
	process.platform === 'win32'
		? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
		: '/etc/hosts';

// Ensure config directory exists
fs.mkdirSync(path.dirname(socketPath), { recursive: true });

// The daemon runs detached with stdio ignored — this file is its ONLY voice. Every
// start, signal, crash, and exit leaves a line, so a dead daemon is diagnosable.
const logPath = path.join(path.dirname(socketPath), 'daemon.log');
const log = (line: string): void => {
	try {
		fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${line}\n`);
	} catch {
		// logging must never take the daemon down
	}
};

log(`starting pid=${process.pid} uid=${process.getuid?.() ?? '?'} node=${process.version}`);

process.on('uncaughtException', (err) => {
	log(`uncaughtException: ${err.stack ?? String(err)}`);
	process.exit(1);
});
process.on('unhandledRejection', (reason) => {
	log(`unhandledRejection: ${reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)}`);
});
for (const signal of ['SIGTERM', 'SIGINT', 'SIGHUP'] as const) {
	process.on(signal, () => {
		log(`received ${signal} — exiting`);
		process.exit(0);
	});
}
process.on('exit', (code) => log(`exit code=${code}`));

startDaemonServer({ socketPath, pidPath, hostsPath });
