import type { ProxyDevCommand } from './types.js';

export const confirmYesCommand: ProxyDevCommand = {
	id: 'confirm-yes',
	keys: [{ textKey: 'y' }],
	displayKey: 'y',
	displayText: 'yes',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'confirmation',
	execute: (deps) => {
		deps.ui.confirmCallback?.();
		deps.ui.closeConfirm();
	},
};

export const confirmNoCommand: ProxyDevCommand = {
	id: 'confirm-no',
	keys: [{ textKey: 'n' }],
	displayKey: 'n',
	displayText: 'no',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'confirmation',
	execute: (deps) => deps.ui.closeConfirm(),
};
