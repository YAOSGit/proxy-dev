import type { ProxyDevCommand } from './types.js';

export const navigateUpCommand: ProxyDevCommand = {
	id: 'navigate-up',
	keys: [{ specialKey: 'upArrow' }, { textKey: 'k' }],
	displayKey: '\u2191 / \u2193',
	displayText: 'move',
	helpSection: 'Traffic',
	helpLabel: 'Navigate requests',
	footer: 'priority',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' && deps.ui.viewLevel === 'traffic',
	execute: (deps) =>
		deps.traffic.selectIndex(Math.max(0, deps.traffic.selectedIndex - 1)),
};

export const navigateDownCommand: ProxyDevCommand = {
	id: 'navigate-down',
	keys: [{ specialKey: 'downArrow' }, { textKey: 'j' }],
	displayKey: '\u2193',
	displayText: 'down',
	footer: 'hidden',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' && deps.ui.viewLevel === 'traffic',
	execute: (deps) =>
		deps.traffic.selectIndex(
			Math.min(deps.traffic.entries.length - 1, deps.traffic.selectedIndex + 1),
		),
};

export const inspectCommand: ProxyDevCommand = {
	id: 'inspect',
	keys: [{ specialKey: 'return' }],
	displayKey: 'Enter',
	displayText: 'inspect',
	helpSection: 'Traffic',
	helpLabel: 'Open detail inspector',
	footer: 'priority',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' &&
		deps.ui.viewLevel === 'traffic' &&
		deps.selectedEntry !== null,
	execute: (deps) => deps.ui.openDetail(),
};
