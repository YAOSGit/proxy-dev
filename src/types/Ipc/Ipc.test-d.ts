import { assertType, describe, expectTypeOf, it } from 'vitest';
import type { DaemonCommand, DaemonResponse, HostCommand, HostResponse, ProxyCommand, ProxyEvent } from './index.js';

describe('IPC type tests', () => {
    it('HostCommand is a discriminated union by action', () => {
        assertType<HostCommand>({ action: 'add', domain: 'api.local' });
        assertType<HostCommand>({ action: 'remove', domain: 'api.local' });
        assertType<HostCommand>({ action: 'cleanup' });
        assertType<HostCommand>({ action: 'list' });
    });

    it('HostResponse is a discriminated union by ok', () => {
        assertType<HostResponse>({ ok: true });
        assertType<HostResponse>({ ok: false, error: 'permission denied' });
    });

    it('ProxyCommand is a discriminated union by type', () => {
        assertType<ProxyCommand>({ type: 'stop' });
    });

    it('ProxyEvent is a discriminated union by type', () => {
        assertType<ProxyEvent>({ type: 'ready', port: 443 });
        assertType<ProxyEvent>({ type: 'error', message: 'err' });
    });

    it('ProxyCommand has required type field', () => {
        expectTypeOf<ProxyCommand>().toHaveProperty('type');
    });

    it('DaemonCommand accepts ping and shutdown', () => {
        expectTypeOf<{ action: 'ping' }>().toMatchTypeOf<DaemonCommand>();
        expectTypeOf<{ action: 'shutdown' }>().toMatchTypeOf<DaemonCommand>();
    });

    it('DaemonResponse matches HostResponse shape', () => {
        expectTypeOf<{ ok: true }>().toMatchTypeOf<DaemonResponse>();
        expectTypeOf<{ ok: false; error: string }>().toMatchTypeOf<DaemonResponse>();
    });
});
