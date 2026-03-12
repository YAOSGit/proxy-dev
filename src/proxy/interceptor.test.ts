import { describe, expect, it } from 'vitest';
import { matchRoute } from './interceptor.js';
import type { RouteWithMock } from './interceptor.js';

describe('matchRoute', () => {
    const routes: RouteWithMock[] = [
        { domain: 'api.local', target: 3000 },
        { domain: 'api.local', path: '/users', target: 3001 },
        { domain: 'api.local', path: '/users/admin', target: 3002 },
        { domain: 'web.local', target: 4000 },
    ];

    it('returns null when no route matches domain', () => {
        expect(matchRoute('other.local', '/foo', routes)).toBeNull();
    });

    it('matches catch-all route when no path specified', () => {
        const match = matchRoute('web.local', '/any-path', routes);
        expect(match?.target).toBe(4000);
    });

    it('matches exact path prefix', () => {
        const match = matchRoute('api.local', '/users', routes);
        expect(match?.target).toBe(3001);
    });

    it('uses longest path prefix match', () => {
        const match = matchRoute('api.local', '/users/admin/settings', routes);
        expect(match?.target).toBe(3002);
    });

    it('falls back to catch-all when no path matches', () => {
        const match = matchRoute('api.local', '/orders', routes);
        expect(match?.target).toBe(3000);
    });
});
