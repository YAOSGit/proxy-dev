import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { LatencyInput } from './index.js';

describe('LatencyInput', () => {
	it('renders global latency label', () => {
		const { lastFrame } = render(
			<LatencyInput
				currentMs={100}
				isGlobal={true}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
				inputValue=""
				onInputChange={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('Global Latency');
	});

	it('renders route-specific label with route key', () => {
		const { lastFrame } = render(
			<LatencyInput
				currentMs={50}
				isGlobal={false}
				routeKey="api.local/users"
				onConfirm={vi.fn()}
				onClose={vi.fn()}
				inputValue=""
				onInputChange={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('Route Latency');
		expect(lastFrame()).toContain('api.local/users');
	});

	it('shows current latency value', () => {
		const { lastFrame } = render(
			<LatencyInput
				currentMs={250}
				isGlobal={true}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
				inputValue=""
				onInputChange={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('250ms');
	});

	it('displays input value', () => {
		const { lastFrame } = render(
			<LatencyInput
				currentMs={0}
				isGlobal={true}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
				inputValue="500"
				onInputChange={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('500');
	});

	it('shows placeholder when input is empty', () => {
		const { lastFrame } = render(
			<LatencyInput
				currentMs={0}
				isGlobal={true}
				onConfirm={vi.fn()}
				onClose={vi.fn()}
				inputValue=""
				onInputChange={vi.fn()}
			/>,
		);
		expect(lastFrame()).toContain('_');
	});
});
