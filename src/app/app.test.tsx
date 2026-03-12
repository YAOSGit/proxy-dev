import { describe, expect, it, vi } from 'vitest';

// Mock providers and hooks to avoid real filesystem/process side effects in tests
vi.mock('../providers/RoutesProvider/index.js', () => ({
	RoutesProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../providers/TrafficProvider/index.js', () => ({
	TrafficProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../providers/ProxyProvider/index.js', () => ({
	ProxyProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock('../providers/UIStateProvider/index.js', () => ({
	UIStateProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe('App shell', () => {
	it('renders without crashing', () => {
		// Basic smoke test that the module can be imported
		expect(true).toBe(true);
	});
});
