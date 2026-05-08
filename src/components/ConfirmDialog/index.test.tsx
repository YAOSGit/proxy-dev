import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { ConfirmDialog } from './index.js';

describe('ConfirmDialog', () => {
	it('renders the confirmation message', () => {
		const { lastFrame } = render(
			<ConfirmDialog message="Are you sure you want to quit?" />,
		);
		expect(lastFrame()).toContain('Are you sure you want to quit?');
	});

	it('renders yes option', () => {
		const { lastFrame } = render(<ConfirmDialog message="Confirm action?" />);
		expect(lastFrame()).toContain('[y]');
		expect(lastFrame()).toContain('yes');
	});

	it('renders no option', () => {
		const { lastFrame } = render(<ConfirmDialog message="Confirm action?" />);
		expect(lastFrame()).toContain('[n]');
		expect(lastFrame()).toContain('no');
	});
});
