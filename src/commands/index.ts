import { createCommandsProvider } from '@yaos-git/toolkit/tui/commands';
import { clearCommand, reloadCommand, snapshotCommand } from './actions.js';
import { backCommand } from './back.js';
import { confirmNoCommand, confirmYesCommand } from './confirm.js';
import {
	scrollDownCommand,
	scrollUpCommand,
	tabSwitchCommand,
} from './detail.js';
import { latencyConfirmCommand, latencyOpenCommand } from './latency.js';
import {
	inspectCommand,
	navigateDownCommand,
	navigateUpCommand,
} from './navigation.js';
import { mockPickerCommand, routeConfigCommand } from './overlays.js';
import {
	rcDeleteCommand,
	rcNavigateCommand,
	rcSelectCommand,
	rcToggleGroupCommand,
	rcToggleUpgradeCommand,
} from './routeConfig.js';
import type { ProxyDevCommand, ProxyDevDeps } from './types.js';

/**
 * Project-specific commands in priority order — first match in the loop wins.
 * Overlay-specific commands go before general commands so they take priority.
 *
 * Note: help, quit, scroll, and cycleFocus commands are appended by
 * the toolkit's createCommandsProvider automatically.
 */
const PROJECT_COMMANDS: ProxyDevCommand[] = [
	// Override toolkit quit: confirm when proxy is running
	{
		id: 'QUIT',
		keys: [{ textKey: 'q' }],
		displayKey: 'q',
		displayText: 'quit',
		helpSection: 'General',
		helpLabel: 'Exit proxy-dev',
		footer: 'priority',
		footerOrder: 99,
		isEnabled: (deps) =>
			deps.ui.activeOverlay === 'none' && !deps.isOverlayOpen,
		execute: (deps) => deps.onQuit(),
		needsConfirmation: (deps) => deps.proxy.status === 'running',
		confirmMessage: 'Proxy is running. Quit anyway?',
	},

	// Confirm dialog
	confirmYesCommand,
	confirmNoCommand,

	// Route config overlay (display-only — actual handling lives in RouteConfig's useInput)
	rcNavigateCommand,
	rcSelectCommand,
	rcToggleGroupCommand,
	rcToggleUpgradeCommand,
	rcDeleteCommand,

	// Latency input overlay
	latencyConfirmCommand,

	// Traffic navigation
	navigateUpCommand,
	navigateDownCommand,
	inspectCommand,

	// Back/Escape
	backCommand,

	// Detail view
	tabSwitchCommand,
	scrollUpCommand,
	scrollDownCommand,

	// Overlay openers
	mockPickerCommand,
	latencyOpenCommand,
	routeConfigCommand,

	// Actions
	snapshotCommand,
	clearCommand,
	reloadCommand,
];

const { CommandsProvider, useCommands, COMMANDS } =
	createCommandsProvider<ProxyDevDeps>(PROJECT_COMMANDS);

export type { ProxyDevCommand, ProxyDevDeps } from './types.js';
export { COMMANDS, CommandsProvider, PROJECT_COMMANDS, useCommands };
