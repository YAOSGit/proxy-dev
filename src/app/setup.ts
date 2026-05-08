import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureLeafCert, generateCA, loadCA } from '../ssl/index.js';
import type { ResolvedConfig } from '../types/Config/index.js';
import type { CertPathsForWorker } from '../types/Ipc/index.js';
import {
	loadGlobalConfig,
	loadLocalConfig,
	mergeConfigs,
} from '../utils/config/index.js';
import {
	getCertsDir,
	getLeavesDir,
	getPidPath,
} from '../utils/platform/index.js';

type SetupResult = {
	resolved: ResolvedConfig;
	certs: CertPathsForWorker;
	cleanup: () => void;
};

const setup = async (opts?: {
	config?: string;
	mode?: string;
}): Promise<SetupResult> => {
	const global = loadGlobalConfig();
	const local = loadLocalConfig(opts?.config ? opts.config : undefined);
	const resolved = mergeConfigs(global, local);
	const certsDir = getCertsDir();
	const leavesDir = getLeavesDir();

	let ca = loadCA(certsDir);
	if (!ca) {
		console.log('Generating CA...');
		ca = generateCA(certsDir);
	}

	// Generate leaf certs for each domain
	const domains = [...new Set(resolved.routes.map((r) => r.domain))];
	for (const domain of domains) {
		ensureLeafCert(domain, ca, leavesDir);
	}

	// Write PID
	fs.writeFileSync(getPidPath(), String(process.pid));

	// Ensure daemon is running
	const { DaemonClient, spawnDaemon, isDaemonRunning } = await import(
		'../daemon/index.js'
	);
	const { getDaemonSocketPath, getDaemonPidPath } = await import(
		'../utils/platform/index.js'
	);

	const socketPath = getDaemonSocketPath();
	const pidPath = getDaemonPidPath();

	const alreadyRunning = await isDaemonRunning(socketPath);
	if (!alreadyRunning) {
		console.log('Starting hosts daemon...');
		try {
			execFileSync('sudo', ['-v'], { stdio: 'inherit' });
		} catch {
			console.error('\n  Authentication failed or was cancelled.');
			console.error(
				'  proxy-dev needs sudo to manage /etc/hosts and listen on port 443/80.',
			);
			process.exit(1);
		}
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const daemonPath = path.resolve(__dirname, 'daemon.js');
		const started = await spawnDaemon(daemonPath, socketPath, pidPath);
		if (!started) {
			console.error('Failed to start hosts daemon.');
			process.exit(1);
		}
		console.log('  Hosts daemon started.');
	} else {
		console.log('Hosts daemon already running.');
	}

	// Register cleanup handlers — only remove this instance's domains from
	// /etc/hosts, not all proxy-dev entries (other instances may be running).
	const appPidPath = getPidPath();
	const instanceDomains = [...new Set(resolved.routes.map((r) => r.domain))];
	const asyncCleanup = async () => {
		try {
			const client = new DaemonClient(socketPath);
			for (const domain of instanceDomains) {
				await client.removeHost(domain).catch(() => {});
			}
		} catch {}
		try {
			fs.unlinkSync(appPidPath);
		} catch {}
		process.exit(0);
	};
	const cleanup = (): void => {
		try {
			fs.unlinkSync(appPidPath);
		} catch {}
	};
	process.on('SIGTERM', () => {
		asyncCleanup();
	});
	process.on('SIGINT', () => {
		asyncCleanup();
	});
	process.on('exit', () => {
		try {
			fs.unlinkSync(appPidPath);
		} catch {}
	});

	return {
		resolved,
		certs: {
			caCert: path.join(certsDir, 'ca.crt'),
			leavesDir,
		},
		cleanup,
	};
};

export type { SetupResult };
export { setup };
