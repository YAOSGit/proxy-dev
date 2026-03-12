import { useCallback, useState } from 'react';

type ViewLevel = 'traffic' | 'detail';
type DetailPane = 'request' | 'response';

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

type UseUIStateReturn = UIState & {
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

    const openDetail = useCallback(() =>
        setState((s) => ({ ...s, viewLevel: 'detail', scrollOffset: 0 })), []);
    const closeDetail = useCallback(() =>
        setState((s) => ({ ...s, viewLevel: 'traffic', scrollOffset: 0 })), []);
    const switchDetailPane = useCallback(() =>
        setState((s) => ({
            ...s,
            activeDetailPane: s.activeDetailPane === 'request' ? 'response' : 'request',
            scrollOffset: 0,
        })), []);

    const openMockPicker = useCallback(() =>
        setState((s) => ({ ...s, showMockPicker: true })), []);
    const closeMockPicker = useCallback(() =>
        setState((s) => ({ ...s, showMockPicker: false })), []);

    const openLatencyInput = useCallback(() =>
        setState((s) => ({ ...s, showLatencyInput: true })), []);
    const closeLatencyInput = useCallback(() =>
        setState((s) => ({ ...s, showLatencyInput: false })), []);

    const openHelp = useCallback(() =>
        setState((s) => ({ ...s, showHelp: true })), []);
    const closeHelp = useCallback(() =>
        setState((s) => ({ ...s, showHelp: false })), []);

    const openRouteConfig = useCallback(() =>
        setState((s) => ({ ...s, showRouteConfig: true })), []);
    const closeRouteConfig = useCallback(() =>
        setState((s) => ({ ...s, showRouteConfig: false })), []);

    const openConfirm = useCallback((message: string, callback: () => void) =>
        setState((s) => ({ ...s, showConfirm: true, confirmMessage: message, confirmCallback: callback })), []);
    const closeConfirm = useCallback(() =>
        setState((s) => ({ ...s, showConfirm: false, confirmMessage: '', confirmCallback: null })), []);

    const scroll = useCallback((delta: number) =>
        setState((s) => ({ ...s, scrollOffset: Math.max(0, s.scrollOffset + delta) })), []);
    const resetScroll = useCallback(() =>
        setState((s) => ({ ...s, scrollOffset: 0 })), []);

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
    };
};

export { useUIState };
export type { UseUIStateReturn, UIState, ViewLevel, DetailPane };
