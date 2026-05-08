import { useCallback, useState } from 'react';
import { DaemonClient } from '../../daemon/index.js';
import { getDaemonSocketPath } from '../../utils/platform/index.js';

type HostsStatus = 'idle' | 'connecting' | 'running' | 'error';

type UseHostsReturn = {
	status: HostsStatus;
	activeDomains: string[];
	addHost: (domain: string) => Promise<void>;
	removeHost: (domain: string) => Promise<void>;
	cleanup: () => Promise<void>;
	listHosts: () => Promise<string[]>;
};

const useHosts = (): UseHostsReturn => {
	const [status, setStatus] = useState<HostsStatus>('idle');
	const [activeDomains, setActiveDomains] = useState<string[]>([]);
	const [client] = useState<DaemonClient>(() => {
		const socketPath = getDaemonSocketPath();
		const c = new DaemonClient(socketPath);
		setStatus('connecting');
		c.ping()
			.then((ok) => {
				setStatus(ok ? 'running' : 'error');
			})
			.catch(() => setStatus('error'));
		return c;
	});

	const addHost = useCallback(
		async (domain: string) => {
			await client.addHost(domain);
			setActiveDomains((prev) =>
				prev.includes(domain) ? prev : [...prev, domain],
			);
		},
		[client],
	);

	const removeHost = useCallback(
		async (domain: string) => {
			await client.removeHost(domain);
			setActiveDomains((prev) => prev.filter((d) => d !== domain));
		},
		[client],
	);

	const cleanup = useCallback(async () => {
		await client.cleanup();
		setActiveDomains([]);
	}, [client]);

	const listHosts = useCallback(async () => {
		const domains = await client.listHosts();
		setActiveDomains(domains);
		return domains;
	}, [client]);

	return {
		status,
		activeDomains,
		addHost,
		removeHost,
		cleanup,
		listHosts,
	};
};

export type { HostsStatus, UseHostsReturn };
export { useHosts };
