import React, { createContext, useContext, useEffect } from 'react';
import type { UseHostsReturn } from '../../hooks/useHosts/index.js';
import { useHosts } from '../../hooks/useHosts/index.js';
import { useRoutesContext } from '../RoutesProvider/index.js';
import { getCertsDir, getLeavesDir } from '../../utils/platform/index.js';
import { loadCA, ensureLeafCert } from '../../ssl/index.js';
import type { HostsProviderProps } from './HostsProvider.types.js';

const HostsContext = createContext<UseHostsReturn | undefined>(undefined);

const useHostsContext = (): UseHostsReturn => {
	const context = useContext(HostsContext);
	if (context === undefined) {
		throw new Error('useHostsContext must be used within a HostsProvider');
	}
	return context;
};

const HostsProvider: React.FC<HostsProviderProps> = ({ children }) => {
	const hosts = useHosts();
	const { routes } = useRoutesContext();

	useEffect(() => {
		const domains = [...new Set(routes.map(r => r.domain))];

		const sync = async () => {
			const certsDir = getCertsDir();
			const leavesDir = getLeavesDir();
			const ca = loadCA(certsDir);

			for (const domain of domains) {
				if (ca) {
					try {
						ensureLeafCert(domain, ca, leavesDir);
					} catch (e) {
						console.error(`Failed to generate cert for ${domain}:`, e);
					}
				}

				if (!hosts.activeDomains.includes(domain)) {
					await hosts.addHost(domain).catch((err) => {
						console.error(`[hosts] Failed to add ${domain}: ${err instanceof Error ? err.message : String(err)}`);
					});
				}
			}
			for (const domain of hosts.activeDomains) {
				if (!domains.includes(domain)) {
					await hosts.removeHost(domain).catch((err) => {
						console.error(`[hosts] Failed to remove ${domain}: ${err instanceof Error ? err.message : String(err)}`);
					});
				}
			}
		};
		sync();
	}, [routes, hosts]);

	return <HostsContext.Provider value={hosts}>{children}</HostsContext.Provider>;
};

export { HostsProvider, useHostsContext };
