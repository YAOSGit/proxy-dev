import type { ProxyDevCommand } from './types.js';

export const rcNavigateCommand: ProxyDevCommand = {
	id: 'rc-navigate',
	keys: [{ specialKey: 'upArrow' }, { specialKey: 'downArrow' }],
	displayKey: '\u2191\u2193',
	displayText: 'navigate',
	helpSection: 'Overlays',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'routeConfig',
	execute: () => {},
};

export const rcSelectCommand: ProxyDevCommand = {
	id: 'rc-select',
	keys: [{ specialKey: 'return' }],
	displayKey: 'Enter',
	displayText: 'select',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'routeConfig',
	execute: () => {},
};

export const rcToggleGroupCommand: ProxyDevCommand = {
	id: 'rc-toggle-group',
	keys: [{ textKey: 'g' }],
	displayKey: 'g',
	displayText: 'toggle',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'routeConfig',
	execute: () => {},
};

export const rcToggleUpgradeCommand: ProxyDevCommand = {
	id: 'rc-toggle-upgrade',
	keys: [{ textKey: 's' }],
	displayKey: 's',
	displayText: 'upgrade',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'routeConfig',
	execute: () => {},
};

export const rcDeleteCommand: ProxyDevCommand = {
	id: 'rc-delete',
	keys: [{ textKey: 'd' }],
	displayKey: 'd',
	displayText: 'delete',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'routeConfig',
	execute: () => {},
};
