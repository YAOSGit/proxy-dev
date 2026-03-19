import type { ProxyDevCommand } from './types.js';

export const backCommand: ProxyDevCommand = {
	id: 'back',
	keys: [{ specialKey: 'escape' }],
	displayKey: 'Esc',
	displayText: 'back',
	helpSection: 'Detail',
	helpLabel: 'Go back',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.viewLevel === 'detail',
	execute: (deps) => deps.ui.closeDetail(),
};
