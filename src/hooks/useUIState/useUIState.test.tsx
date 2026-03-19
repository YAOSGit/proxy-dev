import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useUIState } from './index.js';

describe('useUIState', () => {
	it('starts at traffic view level', () => {
		const { result } = renderHook(() => useUIState());
		expect(result.current.viewLevel).toBe('traffic');
	});

	it('starts with request detail pane', () => {
		const { result } = renderHook(() => useUIState());
		expect(result.current.activeDetailPane).toBe('request');
	});

	it('starts with all overlays closed', () => {
		const { result } = renderHook(() => useUIState());
		expect(result.current.showHelp).toBe(false);
		expect(result.current.showMockPicker).toBe(false);
		expect(result.current.showLatencyInput).toBe(false);
		expect(result.current.showRouteConfig).toBe(false);
		expect(result.current.showConfirm).toBe(false);
	});

	it('starts with zero scroll offset', () => {
		const { result } = renderHook(() => useUIState());
		expect(result.current.scrollOffset).toBe(0);
	});

	it('opens and closes detail view', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.openDetail());
		expect(result.current.viewLevel).toBe('detail');
		act(() => result.current.closeDetail());
		expect(result.current.viewLevel).toBe('traffic');
	});

	it('switches detail pane', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.openDetail());
		expect(result.current.activeDetailPane).toBe('request');
		act(() => result.current.switchDetailPane());
		expect(result.current.activeDetailPane).toBe('response');
		act(() => result.current.switchDetailPane());
		expect(result.current.activeDetailPane).toBe('request');
	});

	it('opens and closes help', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.openHelp());
		expect(result.current.showHelp).toBe(true);
		act(() => result.current.closeHelp());
		expect(result.current.showHelp).toBe(false);
	});

	it('opens and closes mock picker', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.openMockPicker());
		expect(result.current.showMockPicker).toBe(true);
		act(() => result.current.closeMockPicker());
		expect(result.current.showMockPicker).toBe(false);
	});

	it('opens and closes latency input', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.openLatencyInput());
		expect(result.current.showLatencyInput).toBe(true);
		act(() => result.current.closeLatencyInput());
		expect(result.current.showLatencyInput).toBe(false);
	});

	it('opens and closes route config', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.openRouteConfig());
		expect(result.current.showRouteConfig).toBe(true);
		act(() => result.current.closeRouteConfig());
		expect(result.current.showRouteConfig).toBe(false);
	});

	it('opens and closes confirm dialog', () => {
		const { result } = renderHook(() => useUIState());
		const cb = () => {};
		act(() => result.current.openConfirm('Are you sure?', cb));
		expect(result.current.showConfirm).toBe(true);
		expect(result.current.confirmMessage).toBe('Are you sure?');
		act(() => result.current.closeConfirm());
		expect(result.current.showConfirm).toBe(false);
		expect(result.current.confirmMessage).toBe('');
	});

	it('scrolls and resets scroll', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.scroll(5));
		expect(result.current.scrollOffset).toBe(5);
		act(() => result.current.scroll(3));
		expect(result.current.scrollOffset).toBe(8);
		act(() => result.current.resetScroll());
		expect(result.current.scrollOffset).toBe(0);
	});

	it('does not allow negative scroll offset', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.scroll(-10));
		expect(result.current.scrollOffset).toBe(0);
	});

	it('activeOverlay returns none when nothing open', () => {
		const { result } = renderHook(() => useUIState());
		expect(result.current.activeOverlay).toBe('none');
	});

	it('activeOverlay reflects opened overlay', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.openHelp());
		expect(result.current.activeOverlay).toBe('help');
	});

	it('setActiveOverlay opens overlay by name', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.setActiveOverlay('routeConfig'));
		expect(result.current.showRouteConfig).toBe(true);
		expect(result.current.activeOverlay).toBe('routeConfig');
	});

	it('setActiveOverlay closes all when set to none', () => {
		const { result } = renderHook(() => useUIState());
		act(() => result.current.openHelp());
		act(() => result.current.setActiveOverlay('none'));
		expect(result.current.showHelp).toBe(false);
		expect(result.current.activeOverlay).toBe('none');
	});
});
