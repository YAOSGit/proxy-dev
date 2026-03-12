import { render } from 'ink-testing-library';
import { describe, expect, it } from 'vitest';
import { SystemHeader, formatUptime } from './index.js';

describe('SystemHeader', () => {
    it('renders uptime', () => {
        const { lastFrame } = render(
            <SystemHeader uptimeMs={65000} hostCount={2} caTrusted={true} port={443} proxyStatus="running" lastError={null} configMode="merged" version="1.0.0" />,
        );
        expect(lastFrame()).toContain('1m5s');
    });

    it('renders host count', () => {
        const { lastFrame } = render(
            <SystemHeader uptimeMs={0} hostCount={3} caTrusted={true} port={443} proxyStatus="running" lastError={null} configMode="merged" version="1.0.0" />,
        );
        expect(lastFrame()).toContain('3 hosts');
    });

    it('shows CA trusted', () => {
        const { lastFrame } = render(
            <SystemHeader uptimeMs={0} hostCount={0} caTrusted={true} port={443} proxyStatus="running" lastError={null} configMode="merged" version="1.0.0" />,
        );
        expect(lastFrame()).toContain('trusted');
    });

    it('shows CA not trusted', () => {
        const { lastFrame } = render(
            <SystemHeader uptimeMs={0} hostCount={0} caTrusted={false} port={443} proxyStatus="running" lastError={null} configMode="merged" version="1.0.0" />,
        );
        const frame = lastFrame() ?? '';
        expect(frame).toContain('CA:');
        expect(frame).not.toContain('CA: trusted');
    });
});

describe('formatUptime', () => {
    it('formats seconds', () => {
        expect(formatUptime(5000)).toBe('5s');
    });

    it('formats minutes and seconds', () => {
        expect(formatUptime(65000)).toBe('1m5s');
    });

    it('formats hours', () => {
        expect(formatUptime(3661000)).toBe('1h1m');
    });
});
