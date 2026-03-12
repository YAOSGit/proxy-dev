import React, { createContext, useContext } from 'react';
import type { UseProxyReturn } from '../../hooks/useProxy/index.js';
import { useProxy } from '../../hooks/useProxy/index.js';
import { useTrafficContext } from '../TrafficProvider/index.js';
import type { ProxyProviderProps } from './ProxyProvider.types.js';

const ProxyContext = createContext<UseProxyReturn | null>(null);

const useProxyContext = (): UseProxyReturn => {
	const ctx = useContext(ProxyContext);
	if (!ctx) throw new Error('useProxyContext must be used within ProxyProvider');
	return ctx;
};

const ProxyProvider: React.FC<ProxyProviderProps> = ({ children }) => {
	const { addEntry } = useTrafficContext();
	const proxy = useProxy(addEntry);
	return <ProxyContext.Provider value={proxy}>{children}</ProxyContext.Provider>;
};

export { ProxyProvider, useProxyContext };
