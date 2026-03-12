import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { ControlBar } from './index.js';
import type { Command } from '../../types/Command/index.js';

const makeCmd = (id: string, key: string, text: string, enabled = true): Command => ({
	id,
	keys: [key],
	displayKey: key,
	displayText: text,
	footer: true,
	isEnabled: () => enabled,
	execute: () => { },
});

describe('ControlBar', () => {
	it('renders command shortcuts', () => {
		const commands = [makeCmd('inspect', 'Enter', 'inspect')];
		const { lastFrame } = render(<ControlBar commands={commands} />);
		expect(lastFrame()).toContain('inspect');
	});

	it('shows branding when no commands available', () => {
		const { lastFrame } = render(<ControlBar commands={[]} />);
		expect(lastFrame()).toContain('YAOSGit');
		expect(lastFrame()).toContain('proxy');
	});

	it('hides disabled commands', () => {
		const commands = [
			makeCmd('inspect', 'Enter', 'inspect', true),
			makeCmd('mock', 'm', 'mock', false),
		];
		const { lastFrame } = render(<ControlBar commands={commands} />);
		expect(lastFrame()).toContain('inspect');
		expect(lastFrame()).not.toContain('│ m mock');
	});
});
