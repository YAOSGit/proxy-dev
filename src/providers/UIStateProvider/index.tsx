import type React from 'react';
import { createContext, useContext } from 'react';
import type { UseUIStateReturn } from '../../hooks/useUIState/index.js';
import { useUIState } from '../../hooks/useUIState/index.js';
import type { UIStateProviderProps } from './UIStateProvider.types.js';

const UIStateContext = createContext<UseUIStateReturn | null>(null);

const useUIStateContext = (): UseUIStateReturn => {
	const ctx = useContext(UIStateContext);
	if (!ctx)
		throw new Error('useUIStateContext must be used within UIStateProvider');
	return ctx;
};

const UIStateProvider: React.FC<UIStateProviderProps> = ({ children }) => {
	const uiState = useUIState();
	return (
		<UIStateContext.Provider value={uiState}>
			{children}
		</UIStateContext.Provider>
	);
};

export { UIStateProvider, useUIStateContext };
