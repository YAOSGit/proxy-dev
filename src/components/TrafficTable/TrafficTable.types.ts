import type { TrafficEntry } from '../../types/Traffic/index.js';

interface TrafficTableProps {
	entries: TrafficEntry[];
	selectedIndex: number;
	height: number;
	domains?: string[];
}

export type { TrafficTableProps };
