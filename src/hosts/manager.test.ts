import { describe, expect, it } from 'vitest';
import type { HostCommand, HostResponse } from '../types/Ipc/index.js';

// Test the IPC protocol serialization/deserialization used by the manager
describe('hosts manager IPC protocol', () => {
    it('serializes HostCommand to JSON', () => {
        const cmd: HostCommand = { action: 'add', domain: 'api.local' };
        const serialized = JSON.stringify(cmd);
        expect(serialized).toBe('{"action":"add","domain":"api.local"}');
    });

    it('deserializes HostResponse from JSON', () => {
        const respStr = '{"ok":true,"domains":["api.local"]}';
        const resp = JSON.parse(respStr) as HostResponse;
        expect(resp.ok).toBe(true);
        if (resp.ok) {
            expect(resp.domains).toEqual(['api.local']);
        }
    });

    it('serializes cleanup command', () => {
        const cmd: HostCommand = { action: 'cleanup' };
        const serialized = JSON.stringify(cmd);
        expect(serialized).toBe('{"action":"cleanup"}');
    });

    it('deserializes error response', () => {
        const respStr = '{"ok":false,"error":"permission denied"}';
        const resp = JSON.parse(respStr) as HostResponse;
        expect(resp.ok).toBe(false);
        if (!resp.ok) {
            expect(resp.error).toBe('permission denied');
        }
    });
});
