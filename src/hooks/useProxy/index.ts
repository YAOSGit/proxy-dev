import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ResolvedConfig } from '../../types/Config/index.js';
import type {
	CertPathsForWorker,
	ProxyCommand,
	ProxyEvent,
} from '../../types/Ipc/index.js';
import type { LatencyConfig } from '../../types/Latency/index.js';
import type { MockVariant } from '../../types/Mock/index.js';

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

	const sendCommand = useCallback((cmd: ProxyCommand) => {
		workerRef.current?.postMessage(cmd);
	}, []);

	const startProxy = useCallback(
		(config: ResolvedConfig, certs: CertPathsForWorker) => {
			if (workerRef.current) return;
			setStatus('starting');

			// Resolve server.ts path relative to this file
			const __dirname = path.dirname(fileURLToPath(import.meta.url));
			const serverPath = path.resolve(__dirname, 'server.js');

			const worker = new Worker(serverPath);
			workerRef.current = worker;

			worker.on('message', (event: ProxyEvent) => {
				if (event.type === 'ready') {
					setStatus('running');
					setPort(event.port);
				} else if (event.type === 'request') {
					onTrafficEntry(event.entry);
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
		[onTrafficEntry],
	);

	const stopProxy = useCallback(() => {
		if (workerRef.current) {
			sendCommand({ type: 'stop' });
		}
	}, [sendCommand]);

	const updateRoutes = useCallback(
		(config: ResolvedConfig) => {
			sendCommand({
				type: 'update-routes',
				config: { port: config.port, routes: config.routes },
			});
		},
		[sendCommand],
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
			workerRef.current?.terminate();
		};
	}, []);

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

export { useProxy };
export type { UseProxyReturn, ProxyStatus };
