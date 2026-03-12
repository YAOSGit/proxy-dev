import { describe, expect, it } from 'vitest';
import { addEntry, getProxyDevEntries, removeEntry, removeAllProxyDevEntries } from './parser.js';

describe('hosts parser', () => {
    const sampleHosts = [
        '127.0.0.1 localhost',
        '255.255.255.255 broadcasthost',
        '::1 localhost',
        '127.0.0.1 api.local # proxy-dev managed',
        '127.0.0.1 web.local # proxy-dev managed',
    ].join('\n');

    it('getProxyDevEntries returns only managed entries', () => {
        const entries = getProxyDevEntries(sampleHosts);
        expect(entries).toEqual(['api.local', 'web.local']);
    });

    it('addEntry appends managed entry', () => {
        const result = addEntry('127.0.0.1 localhost\n', 'app.local');
        expect(result).toContain('127.0.0.1 app.local # proxy-dev managed');
    });

    it('addEntry does not duplicate existing managed entry', () => {
        const result = addEntry(sampleHosts, 'api.local');
        const matches = result.match(/api\.local/g);
        expect(matches?.length).toBe(1);
    });

    it('removeEntry removes only specified managed entry', () => {
        const result = removeEntry(sampleHosts, 'api.local');
        expect(result).not.toContain('api.local');
        expect(result).toContain('web.local');
        expect(result).toContain('localhost');
    });

    it('removeAllProxyDevEntries removes all managed entries', () => {
        const result = removeAllProxyDevEntries(sampleHosts);
        expect(result).not.toContain('proxy-dev managed');
        expect(result).toContain('localhost');
    });

    it('removeEntry leaves non-managed entries intact', () => {
        const result = removeEntry(sampleHosts, 'api.local');
        expect(result).toContain('localhost');
        expect(result).toContain('broadcasthost');
    });
});
