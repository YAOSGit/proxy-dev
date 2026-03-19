import { useCallback, useMemo, useState } from 'react';
import type { OverlayState, PendingConfirmation } from '@yaos-git/toolkit/types';

type ViewLevel = 'traffic' | 'detail';
type DetailPane = 'request' | 'response';

type ProxyOverlay = 'help' | 'mock' | 'confirmation' | 'routeConfig' | 'latency';

type UIState = {
	viewLevel: ViewLevel;
	activeDetailPane: DetailPane;
	showMockPicker: boolean;
	showLatencyInput: boolean;
	showHelp: boolean;
	showRouteConfig: boolean;
	showConfirm: boolean;
	scrollOffset: number;
	confirmMessage: string;
	confirmCallback: (() => void) | null;
};

type UseUIStateReturn = UIState &
	OverlayState & {
		cycleFocus: () => void;
		openDetail: () => void;
		closeDetail: () => void;
		switchDetailPane: () => void;
		openMockPicker: () => void;
		closeMockPicker: () => void;
		openLatencyInput: () => void;
		closeLatencyInput: () => void;
		openHelp: () => void;
		closeHelp: () => void;
		openRouteConfig: () => void;
		closeRouteConfig: () => void;
		openConfirm: (message: string, callback: () => void) => void;
		closeConfirm: () => void;
		scroll: (delta: number) => void;
		resetScroll: () => void;
	};

const INITIAL_STATE: UIState = {
	viewLevel: 'traffic',
	activeDetailPane: 'request',
	showMockPicker: false,
	showLatencyInput: false,
	showHelp: false,
	showRouteConfig: false,
	showConfirm: false,
	scrollOffset: 0,
	confirmMessage: '',
	confirmCallback: null,
};

const useUIState = (): UseUIStateReturn => {
	const [state, setState] = useState<UIState>(INITIAL_STATE);

	const openDetail = useCallback(
		() => setState((s) => ({ ...s, viewLevel: 'detail', scrollOffset: 0 })),
		[],
	);
	const closeDetail = useCallback(
		() => setState((s) => ({ ...s, viewLevel: 'traffic', scrollOffset: 0 })),
		[],
	);
	const switchDetailPane = useCallback(
		() =>
			setState((s) => ({
				...s,
				activeDetailPane:
					s.activeDetailPane === 'request' ? 'response' : 'request',
				scrollOffset: 0,
			})),
		[],
	);

	const openMockPicker = useCallback(
		() => setState((s) => ({ ...s, showMockPicker: true })),
		[],
	);
	const closeMockPicker = useCallback(
		() => setState((s) => ({ ...s, showMockPicker: false })),
		[],
	);

	const openLatencyInput = useCallback(
		() => setState((s) => ({ ...s, showLatencyInput: true })),
		[],
	);
	const closeLatencyInput = useCallback(
		() => setState((s) => ({ ...s, showLatencyInput: false })),
		[],
	);

	const openHelp = useCallback(
		() => setState((s) => ({ ...s, showHelp: true })),
		[],
	);
	const closeHelp = useCallback(
		() => setState((s) => ({ ...s, showHelp: false })),
		[],
	);

	const openRouteConfig = useCallback(
		() => setState((s) => ({ ...s, showRouteConfig: true })),
		[],
	);
	const closeRouteConfig = useCallback(
		() => setState((s) => ({ ...s, showRouteConfig: false })),
		[],
	);

	const openConfirm = useCallback(
		(message: string, callback: () => void) =>
			setState((s) => ({
				...s,
				showConfirm: true,
				confirmMessage: message,
				confirmCallback: callback,
			})),
		[],
	);
	const closeConfirm = useCallback(
		() =>
			setState((s) => ({
				...s,
				showConfirm: false,
				confirmMessage: '',
				confirmCallback: null,
			})),
		[],
	);

	const scroll = useCallback(
		(delta: number) =>
			setState((s) => ({
				...s,
				scrollOffset: Math.max(0, s.scrollOffset + delta),
			})),
		[],
	);
	const resetScroll = useCallback(
		() => setState((s) => ({ ...s, scrollOffset: 0 })),
		[],
	);

	// --- OverlayState adapter ---

	const activeOverlay: string | 'none' = state.showHelp
		? 'help'
		: state.showMockPicker
			? 'mock'
			: state.showConfirm
				? 'confirmation'
				: state.showRouteConfig
					? 'routeConfig'
					: state.showLatencyInput
						? 'latency'
						: 'none';

	const setActiveOverlay = useCallback(
		(overlay: string | 'none') => {
			setState((s) => {
				// Close all overlays first
				const base: UIState = {
					...s,
					showHelp: false,
					showMockPicker: false,
					showConfirm: false,
					showRouteConfig: false,
					showLatencyInput: false,
				};
				// If closing confirm, also clear its message/callback
				if (s.showConfirm && overlay !== 'confirmation') {
					base.confirmMessage = '';
					base.confirmCallback = null;
				}
				// Open the requested overlay
				switch (overlay) {
					case 'help':
						return { ...base, showHelp: true };
					case 'mock':
						return { ...base, showMockPicker: true };
					case 'confirmation':
						return { ...base, showConfirm: true };
					case 'routeConfig':
						return { ...base, showRouteConfig: true };
					case 'latency':
						return { ...base, showLatencyInput: true };
					default:
						return base;
				}
			});
		},
		[],
	);

	const confirmation: PendingConfirmation | null = useMemo(
		() =>
			state.showConfirm && state.confirmCallback
				? { message: state.confirmMessage, onConfirm: state.confirmCallback }
				: null,
		[state.showConfirm, state.confirmMessage, state.confirmCallback],
	);

	const requestConfirmation = useCallback(
		(message: string, onConfirm: () => void) => {
			setState((s) => ({
				...s,
				showConfirm: true,
				confirmMessage: message,
				confirmCallback: onConfirm,
			}));
		},
		[],
	);

	const clearConfirmation = useCallback(() => {
		setState((s) => ({
			...s,
			showConfirm: false,
			confirmMessage: '',
			confirmCallback: null,
		}));
	}, []);

	const cycleFocus = useCallback(() => {}, []);

	return {
		...state,
		openDetail,
		closeDetail,
		switchDetailPane,
		openMockPicker,
		closeMockPicker,
		openLatencyInput,
		closeLatencyInput,
		openHelp,
		closeHelp,
		openRouteConfig,
		closeRouteConfig,
		openConfirm,
		closeConfirm,
		scroll,
		resetScroll,
		// OverlayState adapter
		activeOverlay,
		setActiveOverlay,
		confirmation,
		requestConfirmation,
		clearConfirmation,
		cycleFocus,
	};
};

export { useUIState };
export type { UseUIStateReturn, UIState, ViewLevel, DetailPane, ProxyOverlay };
