import { render } from 'ink-testing-library';
import { describe, expect, it, vi } from 'vitest';
import { MockPicker } from './index.js';

describe('MockPicker', () => {
    it('renders route key', () => {
        const { lastFrame } = render(
            <MockPicker
                routeKey="api.local/users"
                mockRoute={null}
                onSelect={vi.fn()}
                onClose={vi.fn()}
            />,
        );
        expect(lastFrame()).toContain('api.local/users');
    });

    it('renders variants and Live option', () => {
        const mockRoute = {
            variants: { success: { file: './mocks/success.json', status: 200 } },
            active: 'success',
        };
        const { lastFrame } = render(
            <MockPicker
                routeKey="api.local/users"
                mockRoute={mockRoute}
                onSelect={vi.fn()}
                onClose={vi.fn()}
            />,
        );
        expect(lastFrame()).toContain('success');
        expect(lastFrame()).toContain('Live');
    });

    it('shows Live option when no mock route', () => {
        const { lastFrame } = render(
            <MockPicker
                routeKey="api.local"
                mockRoute={null}
                onSelect={vi.fn()}
                onClose={vi.fn()}
            />,
        );
        expect(lastFrame()).toContain('Live');
    });
});
