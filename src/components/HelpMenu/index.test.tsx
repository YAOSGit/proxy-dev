import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import type { Command, BaseDeps } from '@yaos-git/toolkit/types';
import { HelpMenu } from './index.js';

const makeCommand = (overrides: Partial<Command<BaseDeps>> = {}): Command<BaseDeps> => ({
	id: 'test-cmd',
	keys: [{ textKey: 'q' }],
	displayKey: 'q',
	displayText: 'Quit',
	helpSection: 'General',
	helpLabel: 'Quit the app',
	isEnabled: () => true,
	execute: vi.fn(),
	...overrides,
});

describe('HelpMenu', () => {
	it('renders the title', () => {
		const { lastFrame } = render(
			<HelpMenu
				commands={[makeCommand()]}
				sectionColors={{ General: 'cyan' }}
				title="Keyboard Shortcuts"
				onClose={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('Keyboard Shortcuts');
	});

	it('renders command key and label', () => {
		const { lastFrame } = render(
			<HelpMenu
				commands={[makeCommand()]}
				sectionColors={{ General: 'cyan' }}
				title="Help"
				onClose={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('q');
		expect(lastFrame()).toContain('Quit the app');
	});

	it('renders section name', () => {
		const { lastFrame } = render(
			<HelpMenu
				commands={[makeCommand({ helpSection: 'Navigation' })]}
				sectionColors={{ Navigation: 'green' }}
				title="Help"
				onClose={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('Navigation');
	});

	it('renders close hint', () => {
		const { lastFrame } = render(
			<HelpMenu
				commands={[makeCommand()]}
				sectionColors={{ General: 'cyan' }}
				title="Help"
				onClose={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('ESC');
	});
});
