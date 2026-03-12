import { describe, expect, it } from 'vitest';
import { isProxyError, isProxyReady, isProxyRequest, parseEvent, serializeCommand } from './ipc.js';
import type { ProxyCommand, ProxyEvent } from '../types/Ipc/index.js';

describe('proxy IPC', () => {
    describe('serializeCommand', () => {
        it('serializes stop command', () => {
            const cmd: ProxyCommand = { type: 'stop' };
            expect(serializeCommand(cmd)).toBe('{"type":"stop"}\n');
        });

        it('serializes update-latency command', () => {
            const cmd: ProxyCommand = { type: 'update-latency', latency: { globalMs: 200 } };
            const result = serializeCommand(cmd);
            expect(result).toContain('"type":"update-latency"');
            expect(result).toContain('"globalMs":200');
        });
    });

    describe('parseEvent', () => {
        it('parses ready event', () => {
            const event = parseEvent('{"type":"ready","port":443}');
            expect(event).not.toBeNull();
            expect(event?.type).toBe('ready');
        });

        it('parses error event', () => {
            const event = parseEvent('{"type":"error","message":"failed"}');
            expect(event?.type).toBe('error');
        });

        it('returns null for invalid JSON', () => {
            const event = parseEvent('not-json');
            expect(event).toBeNull();
        });
    });

    describe('type guards', () => {
        it('isProxyReady returns true for ready event', () => {
            const event: ProxyEvent = { type: 'ready', port: 443 };
            expect(isProxyReady(event)).toBe(true);
        });

        it('isProxyRequest returns true for request event', () => {
            const event: ProxyEvent = {
                type: 'request',
                entry: {
                    id: '1',
                    timestamp: Date.now(),
                    method: 'GET',
                    domain: 'api.local',
                    path: '/users',
                    status: 200,
                    latencyMs: 10,
                    routeState: 'LIVE',
                    requestHeaders: {},
                    responseHeaders: {},
                },
            };
            expect(isProxyRequest(event)).toBe(true);
        });

        it('isProxyError returns true for error event', () => {
            const event: ProxyEvent = { type: 'error', message: 'failed' };
            expect(isProxyError(event)).toBe(true);
        });
    });
});
