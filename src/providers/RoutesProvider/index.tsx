import React, { createContext, useContext } from 'react';
import type { ConfigMode } from '../../types/Config/index.js';
import type { UseRoutesReturn } from '../../hooks/useRoutes/index.js';
import { useRoutes } from '../../hooks/useRoutes/index.js';
import type { RoutesProviderProps } from './RoutesProvider.types.js';

const RoutesContext = createContext<UseRoutesReturn | null>(null);

const useRoutesContext = (): UseRoutesReturn => {
	const ctx = useContext(RoutesContext);
	if (!ctx) throw new Error('useRoutesContext must be used within RoutesProvider');
	return ctx;
};

const RoutesProvider: React.FC<RoutesProviderProps> = ({ children }) => {
	const mode = (process.env.PROXY_DEV_CONFIG_MODE ?? 'merged') as ConfigMode;
	const routes = useRoutes(mode);
	return <RoutesContext.Provider value={routes}>{children}</RoutesContext.Provider>;
};

export { RoutesProvider, useRoutesContext };
