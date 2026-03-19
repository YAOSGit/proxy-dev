import type { BaseDeps, Command } from '@yaos-git/toolkit/types';
import type { UseHostsReturn } from '../hooks/useHosts/index.js';
import type { UseProxyReturn } from '../hooks/useProxy/index.js';
import type { UseRoutesReturn } from '../hooks/useRoutes/index.js';
import type { UseTrafficReturn } from '../hooks/useTraffic/index.js';
import type { UseUIStateReturn } from '../hooks/useUIState/index.js';
import type { TrafficEntry } from '../types/Traffic/index.js';

export type ProxyDevDeps = BaseDeps & {
	ui: UseUIStateReturn;
	traffic: UseTrafficReturn;
	routes: UseRoutesReturn;
	hosts: UseHostsReturn;
	proxy: UseProxyReturn;
	selectedEntry: TrafficEntry | null;
	isOverlayOpen: boolean;
	latencyInput: string;
	setLatencyInput: (fn: string | ((prev: string) => string)) => void;
};

/**
 * Command type for proxy-dev, using the toolkit's Command<ProxyDevDeps>.
 */
export type ProxyDevCommand = Command<ProxyDevDeps>;
