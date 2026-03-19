import type { ConfigMode } from '../../types/Config/index.js';

interface SystemHeaderProps {
	uptimeMs: number;
	hostCount: number;
	caTrusted: boolean;
	port: number;
	proxyStatus: 'stopped' | 'starting' | 'running' | 'error';
	lastError: string | null;
	configMode: ConfigMode;
	configWarnings?: string[];
}

export type { SystemHeaderProps };
