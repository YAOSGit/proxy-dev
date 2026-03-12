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

startDaemonServer({ socketPath, pidPath, hostsPath });
