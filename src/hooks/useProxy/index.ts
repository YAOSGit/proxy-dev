import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { useCallback, useEffect, useRef, useState } from 'react';
import { DaemonClient } from '../../daemon/index.js';
import type { ResolvedConfig } from '../../types/Config/index.js';
import type {
	CertPathsForWorker,
	ProxyCommand,
	ProxyEvent,
} from '../../types/Ipc/index.js';
import type { LatencyConfig } from '../../types/Latency/index.js';
import type { MockVariant } from '../../types/Mock/index.js';
import { getDaemonSocketPath } from '../../utils/platform/index.js';

type ProxyStatus = 'stopped' | 'starting' | 'running' | 'error';

type UseProxyReturn = {
	status: ProxyStatus;
	port: number | null;
	lastError: string | null;
	startProxy: (config: ResolvedConfig, certs: CertPathsForWorker) => void;
	stopProxy: () => void;
	updateRoutes: (config: ResolvedConfig) => void;
	updateLatency: (latency: LatencyConfig) => void;
	setMock: (routeKey: string, variant: MockVariant | null) => void;
};

const useProxy = (
	onTrafficEntry: (
		entry: import('../../types/Traffic/index.js').TrafficEntry,
	) => void,
): UseProxyReturn => {
	const [status, setStatus] = useState<ProxyStatus>('stopped');
	const [port, setPort] = useState<number | null>(null);
	const [lastError, setLastError] = useState<string | null>(null);
	const workerRef = useRef<Worker | null>(null);
	/** Domains registered with the daemon by this proxy instance. */
	const domainsRef = useRef<string[]>([]);
	/** Internal port the proxy worker is listening on (for updateRoutes diff). */
	const portRef = useRef<number | null>(null);
	/** Ref to track latest onTrafficEntry to avoid stale closure in worker handler. */
	const onTrafficEntryRef = useRef(onTrafficEntry);
	useEffect(() => {
		onTrafficEntryRef.current = onTrafficEntry;
	}, [onTrafficEntry]);

	const sendCommand = useCallback((cmd: ProxyCommand) => {
		workerRef.current?.postMessage(cmd);
	}, []);

	const registerDomains = useCallback(
		(domains: string[], internalPort: number) => {
			const client = new DaemonClient(getDaemonSocketPath());
			for (const domain of domains) {
				client.register(domain, internalPort).catch(() => {});
			}
		},
		[],
	);

	const unregisterDomains = useCallback((domains: string[]) => {
		const client = new DaemonClient(getDaemonSocketPath());
		for (const domain of domains) {
			client.unregister(domain).catch(() => {});
		}
	}, []);

	const startProxy = useCallback(
		(config: ResolvedConfig, certs: CertPathsForWorker) => {
			if (workerRef.current) return;
			setStatus('starting');

			domainsRef.current = [...new Set(config.routes.map((r) => r.domain))];

			// Resolve server.ts path relative to this file
			const __dirname = path.dirname(fileURLToPath(import.meta.url));
			const serverPath = path.resolve(__dirname, 'server.js');

			const worker = new Worker(serverPath);
			workerRef.current = worker;

			worker.on('message', (event: ProxyEvent) => {
				if (event.type === 'ready') {
					setStatus('running');
					setPort(event.port);
					portRef.current = event.port;
					registerDomains(domainsRef.current, event.port);
				} else if (event.type === 'request') {
					onTrafficEntryRef.current(event.entry);
				} else if (event.type === 'error') {
					setStatus('error');
					setLastError(event.message);
				}
			});

			worker.on('error', (err: Error) => {
				setStatus('error');
				setLastError(err.message);
				workerRef.current = null; // allow restart
			});

			worker.on('exit', () => {
				setStatus('stopped');
				workerRef.current = null;
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
		},
		[registerDomains],
	);

	const stopProxy = useCallback(() => {
		if (!workerRef.current) return;
		unregisterDomains(domainsRef.current);
		domainsRef.current = [];
		portRef.current = null;
		sendCommand({ type: 'stop' });
	}, [sendCommand, unregisterDomains]);

	const updateRoutes = useCallback(
		(config: ResolvedConfig) => {
			const newDomains = [...new Set(config.routes.map((r) => r.domain))];
			const oldDomains = domainsRef.current;
			const internalPort = portRef.current;

			if (internalPort !== null) {
				const added = newDomains.filter((d) => !oldDomains.includes(d));
				const removed = oldDomains.filter((d) => !newDomains.includes(d));
				if (added.length > 0) registerDomains(added, internalPort);
				if (removed.length > 0) unregisterDomains(removed);
			}

			domainsRef.current = newDomains;
			sendCommand({
				type: 'update-routes',
				config: { port: config.port, routes: config.routes },
			});
		},
		[sendCommand, registerDomains, unregisterDomains],
	);

	const updateLatency = useCallback(
		(latency: LatencyConfig) => {
			sendCommand({ type: 'update-latency', latency });
		},
		[sendCommand],
	);

	const setMock = useCallback(
		(routeKey: string, variant: MockVariant | null) => {
			sendCommand({ type: 'set-mock', routeKey, variant });
		},
		[sendCommand],
	);

	useEffect(() => {
		return () => {
			if (domainsRef.current.length > 0) {
				unregisterDomains(domainsRef.current);
				domainsRef.current = [];
			}
			workerRef.current?.terminate();
		};
	}, [unregisterDomains]);

	return {
		status,
		port,
		lastError,
		startProxy,
		stopProxy,
		updateRoutes,
		updateLatency,
		setMock,
	};
};

export type { ProxyStatus, UseProxyReturn };
export { useProxy };
