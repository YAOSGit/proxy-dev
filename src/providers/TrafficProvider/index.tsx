import type React from 'react';
import { createContext, useContext } from 'react';
import type { UseTrafficReturn } from '../../hooks/useTraffic/index.js';
import { useTraffic } from '../../hooks/useTraffic/index.js';
import type { TrafficProviderProps } from './TrafficProvider.types.js';

const TrafficContext = createContext<UseTrafficReturn | null>(null);

const useTrafficContext = (): UseTrafficReturn => {
	const ctx = useContext(TrafficContext);
	if (!ctx)
		throw new Error('useTrafficContext must be used within TrafficProvider');
	return ctx;
};

const TrafficProvider: React.FC<TrafficProviderProps> = ({ children }) => {
	const traffic = useTraffic();
	return (
		<TrafficContext.Provider value={traffic}>
			{children}
		</TrafficContext.Provider>
	);
};

export { TrafficProvider, useTrafficContext };
