import type { LatencyConfig } from '../Latency/index.js';
import type { MockVariant } from '../Mock/index.js';
import type { TrafficEntry } from '../Traffic/index.js';

type ResolvedRoutesForWorker = {
	port: number;
	routes: Array<{
		domain: string;
		path?: string;
		target: number;
		latencyMs?: number;
		httpsUpgrade?: boolean;
	}>;
};

type CertPathsForWorker = {
	caCert: string;
	leavesDir: string;
};

// Hosts child IPC (legacy — only used in tests, retained for test compatibility)
type HostCommand =
	| { action: 'add'; domain: string }
	| { action: 'remove'; domain: string }
	| { action: 'cleanup' }
	| { action: 'list' };

type HostResponse =
	| { ok: true; domains?: string[] }
	| { ok: false; error: string };

// Daemon socket IPC
type DaemonCommand =
	| { action: 'add'; domain: string }
	| { action: 'remove'; domain: string }
	| { action: 'cleanup' }
	| { action: 'list' }
	| { action: 'ping' }
	| { action: 'shutdown' }
	/** Register a domain → backend port mapping in the daemon's SNI router. */
	| { action: 'register'; domain: string; port: number }
	/** Remove a domain from the daemon's SNI router. */
	| { action: 'unregister'; domain: string };

type DaemonResponse =
	| { ok: true; domains?: string[] }
	| { ok: false; error: string };

// Proxy worker IPC
type ProxyCommand =
	| {
			type: 'start';
			config: ResolvedRoutesForWorker;
			certs: CertPathsForWorker;
	  }
	| { type: 'update-routes'; config: ResolvedRoutesForWorker }
	| { type: 'update-latency'; latency: LatencyConfig }
	| { type: 'set-mock'; routeKey: string; variant: MockVariant | null }
	| { type: 'stop' };

type ProxyEvent =
	| { type: 'ready'; port: number }
	| { type: 'request'; entry: TrafficEntry }
	| { type: 'error'; message: string };

export type {
	CertPathsForWorker,
	DaemonCommand,
	DaemonResponse,
	HostCommand,
	HostResponse,
	ProxyCommand,
	ProxyEvent,
	ResolvedRoutesForWorker,
};
