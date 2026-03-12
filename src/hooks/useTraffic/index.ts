import { useCallback, useState } from 'react';
import type { TrafficEntry } from '../../types/Traffic/index.js';

const MAX_ENTRIES = 5000;

type UseTrafficReturn = {
	entries: TrafficEntry[];
	selectedIndex: number;
	autoScroll: boolean;
	addEntry: (entry: TrafficEntry) => void;
	clear: () => void;
	selectIndex: (index: number) => void;
	getSelectedEntry: () => TrafficEntry | null;
	setAutoScroll: (value: boolean) => void;
};

const useTraffic = (): UseTrafficReturn => {
	const [entries, setEntries] = useState<TrafficEntry[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>(-1);
	const [autoScroll, setAutoScrollState] = useState<boolean>(true);

	const addEntry = useCallback(
		(entry: TrafficEntry) => {
			setEntries((prev) => {
				const next = [...prev, entry];
				if (next.length > MAX_ENTRIES) {
					return next.slice(next.length - MAX_ENTRIES);
				}
				return next;
			});
			if (autoScroll) {
				setSelectedIndex((prev) => prev + 1);
			}
		},
		[autoScroll],
	);

	const clear = useCallback(() => {
		setEntries([]);
		setSelectedIndex(-1);
	}, []);

	const selectIndex = useCallback((index: number) => {
		setSelectedIndex(index);
	}, []);

	const getSelectedEntry = useCallback((): TrafficEntry | null => {
		if (selectedIndex < 0 || selectedIndex >= entries.length) return null;
		return entries[selectedIndex] ?? null;
	}, [entries, selectedIndex]);

	const setAutoScroll = useCallback((value: boolean) => {
		setAutoScrollState(value);
	}, []);

	return {
		entries,
		selectedIndex,
		autoScroll,
		addEntry,
		clear,
		selectIndex,
		getSelectedEntry,
		setAutoScroll,
	};
};

export { useTraffic, MAX_ENTRIES };
export type { UseTrafficReturn };
