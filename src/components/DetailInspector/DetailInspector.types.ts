import type { TrafficEntry } from '../../types/Traffic/index.js';
import type { DetailPane } from '../../hooks/useUIState/index.js';

interface DetailInspectorProps {
	entry: TrafficEntry;
	activePane: DetailPane;
	scrollOffset: number;
	onClose: () => void;
	onSwitchPane: () => void;
}

export type { DetailInspectorProps };
