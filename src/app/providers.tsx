import type { ReactNode } from 'react';
import { RoutesProvider } from '../providers/RoutesProvider/index.js';
import { HostsProvider } from '../providers/HostsProvider/index.js';
import { TrafficProvider } from '../providers/TrafficProvider/index.js';
import { ProxyProvider } from '../providers/ProxyProvider/index.js';
import { UIStateProvider } from '../providers/UIStateProvider/index.js';

interface AppProvidersProps {
	children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
	return (
		<RoutesProvider>
			<HostsProvider>
				<TrafficProvider>
					<ProxyProvider>
						<UIStateProvider>
							{children}
						</UIStateProvider>
					</ProxyProvider>
				</TrafficProvider>
			</HostsProvider>
		</RoutesProvider>
	);
}
