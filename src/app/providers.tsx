import type React from 'react';

import { HostsProvider } from '../providers/HostsProvider/index.js';
import { ProxyProvider } from '../providers/ProxyProvider/index.js';
import { RoutesProvider } from '../providers/RoutesProvider/index.js';
import { TrafficProvider } from '../providers/TrafficProvider/index.js';
import { UIStateProvider } from '../providers/UIStateProvider/index.js';

interface AppProvidersProps {
	children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
	return (
		<RoutesProvider>
			<HostsProvider>
				<TrafficProvider>
					<ProxyProvider>
						<UIStateProvider>{children}</UIStateProvider>
					</ProxyProvider>
				</TrafficProvider>
			</HostsProvider>
		</RoutesProvider>
	);
};
