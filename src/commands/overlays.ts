import type { ProxyDevCommand } from './types.js';

export const mockPickerCommand: ProxyDevCommand = {
	id: 'mock-picker',
	keys: [{ textKey: 'm' }],
	displayKey: 'm',
	displayText: 'mock',
	helpSection: 'Overlays',
	helpLabel: 'Mock picker',
	footer: 'priority',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' &&
		deps.ui.viewLevel === 'traffic' &&
		deps.selectedEntry !== null,
	execute: (deps) => deps.ui.openMockPicker(),
};

export const routeConfigCommand: ProxyDevCommand = {
	id: 'route-config',
	keys: [{ textKey: 'c' }],
	displayKey: 'c',
	displayText: 'routes',
	helpSection: 'Overlays',
	helpLabel: 'Route config',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'none',
	execute: (deps) => deps.ui.openRouteConfig(),
};
