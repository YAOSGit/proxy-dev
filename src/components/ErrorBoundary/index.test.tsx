import { render } from 'ink-testing-library';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './index.js';

function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
	if (shouldThrow) throw new Error('Test explosion');
	return <>{React.createElement('ink-text', {}, 'All good')}</>;
}

describe('ErrorBoundary', () => {
	it('renders children when no error occurs', () => {
		const { lastFrame } = render(
			<ErrorBoundary>
				<ThrowingChild shouldThrow={false} />
			</ErrorBoundary>,
		);
		expect(lastFrame()).toContain('All good');
	});

	it('renders default fallback on error', () => {
		// Suppress React error boundary console output
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { lastFrame } = render(
			<ErrorBoundary>
				<ThrowingChild shouldThrow={true} />
			</ErrorBoundary>,
		);
		expect(lastFrame()).toContain('Something went wrong');
		expect(lastFrame()).toContain('Test explosion');
		spy.mockRestore();
	});

	it('renders custom fallback when provided', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const fallback = React.createElement('ink-text', {}, 'Custom error view');
		const { lastFrame } = render(
			<ErrorBoundary fallback={fallback}>
				<ThrowingChild shouldThrow={true} />
			</ErrorBoundary>,
		);
		expect(lastFrame()).toContain('Custom error view');
		spy.mockRestore();
	});
});
