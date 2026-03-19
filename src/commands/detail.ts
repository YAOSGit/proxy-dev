import type { ProxyDevCommand } from './types.js';

export const tabSwitchCommand: ProxyDevCommand = {
	id: 'tab-switch',
	keys: [{ specialKey: 'tab' }],
	displayKey: 'Tab',
	displayText: 'switch pane',
	helpSection: 'Detail',
	helpLabel: 'Switch request / response',
	footer: 'priority',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' && deps.ui.viewLevel === 'detail',
	execute: (deps) => deps.ui.switchDetailPane(),
};

export const scrollUpCommand: ProxyDevCommand = {
	id: 'scroll-up',
	keys: [{ specialKey: 'upArrow' }, { textKey: 'k' }],
	displayKey: '\u2191',
	displayText: 'scroll up',
	helpSection: 'Detail',
	helpLabel: 'Scroll active pane',
	footer: 'hidden',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' && deps.ui.viewLevel === 'detail',
	execute: (deps) => deps.ui.scroll(-1),
};

export const scrollDownCommand: ProxyDevCommand = {
	id: 'scroll-down',
	keys: [{ specialKey: 'downArrow' }, { textKey: 'j' }],
	displayKey: '\u2193',
	displayText: 'scroll down',
	footer: 'hidden',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' && deps.ui.viewLevel === 'detail',
	execute: (deps) => deps.ui.scroll(1),
};
