import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { DaemonClient } from '../daemon/index.js';
import type { ResolvedConfig } from '../types/Config/index.js';
import type {
	CertPathsForWorker,
	ProxyCommand,
	ProxyEvent,
} from '../types/Ipc/index.js';
import type { TrafficEntry } from '../types/Traffic/index.js';
import { getDaemonSocketPath } from '../utils/platform/index.js';

const formatLogLine = (entry: TrafficEntry): string => {
	const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
		hour12: false,
	});
	const tag =
		entry.routeState === 'MOCK' ? ` [MOCK:${entry.mockVariant ?? '?'}]` : '';
	return `${time}  ${entry.method} ${entry.domain}${entry.path} → ${entry.status} (${entry.latencyMs}ms)${tag}`;
};

const runHeadless = (
	config: ResolvedConfig,
	certs: CertPathsForWorker,
): Promise<void> => {
	return new Promise((resolve) => {
		const __dirname = path.dirname(fileURLToPath(import.meta.url));
		const serverPath = path.resolve(__dirname, 'server.js');
		const domains = [...new Set(config.routes.map((r) => r.domain))];

		const worker = new Worker(serverPath);

		const shutdown = (): void => {
			worker.postMessage({ type: 'stop' } satisfies ProxyCommand);
		};

		process.on('SIGTERM', shutdown);
		process.on('SIGINT', shutdown);

		worker.on('message', (event: ProxyEvent) => {
			if (event.type === 'ready') {
				console.log(
					`Proxy worker listening on internal port ${event.port} (public via daemon:443)`,
				);
				console.log(
					`Serving ${config.routes.length} route(s) for: ${domains.join(', ')}. Press Ctrl+C to stop.\n`,
				);
				// Register all domains with the daemon's SNI router AND /etc/hosts. The TUI
				// does the hosts half via useHosts; headless must do it itself — without it
				// the domains never resolve (setup's cleanup already removes them on exit).
				const client = new DaemonClient(getDaemonSocketPath());
				for (const domain of domains) {
					client.register(domain, event.port).catch(() => {});
					client
						.addHost(domain)
						.catch((err: Error) =>
							console.error(`[hosts] failed to add ${domain}: ${err.message}`),
						);
				}
			} else if (event.type === 'request') {
				console.log(formatLogLine(event.entry));
			} else if (event.type === 'error') {
				console.error(`[error] ${event.message}`);
			}
		});

		worker.on('error', (err: Error) => {
			console.error(`[worker error] ${err.message}`);
		});

		worker.on('exit', () => {
			process.off('SIGTERM', shutdown);
			process.off('SIGINT', shutdown);
			// Unregister domains from the daemon's SNI router
			const client = new DaemonClient(getDaemonSocketPath());
			for (const domain of domains) {
				client.unregister(domain).catch(() => {});
			}
			resolve();
		});

		const startCmd: ProxyCommand = {
			type: 'start',
			config: {
				port: config.port,
				routes: config.routes,
			},
			certs,
		};
		worker.postMessage(startCmd);
	});
};

export { formatLogLine, runHeadless };
