import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import type { ResolvedConfig } from '../types/Config/index.js';
import type {
	CertPathsForWorker,
	ProxyCommand,
	ProxyEvent,
} from '../types/Ipc/index.js';
import type { TrafficEntry } from '../types/Traffic/index.js';

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

		const worker = new Worker(serverPath);

		const shutdown = (): void => {
			worker.postMessage({ type: 'stop' } satisfies ProxyCommand);
		};

		process.on('SIGTERM', shutdown);
		process.on('SIGINT', shutdown);

		worker.on('message', (event: ProxyEvent) => {
			if (event.type === 'ready') {
				console.log(`Proxy listening on port ${event.port}`);
				console.log(
					`Serving ${config.routes.length} route(s). Press Ctrl+C to stop.\n`,
				);
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

export { runHeadless, formatLogLine };
