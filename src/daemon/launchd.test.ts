import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generatePlist, LABEL, writePlist } from './launchd.js';

describe('launchd plist', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-launchd-'));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('generates valid plist XML', () => {
		const nodePath = '/usr/local/bin/node';
		const scriptPath = '/opt/proxy-dev/daemon.js';
		const plist = generatePlist(nodePath, scriptPath);

		expect(plist).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(plist).toContain(`<string>${LABEL}</string>`);
		expect(plist).toContain(`<string>${nodePath}</string>`);
		expect(plist).toContain(`<string>${scriptPath}</string>`);
		expect(plist).toContain('<key>RunAtLoad</key>');
		expect(plist).toContain('<true/>');
		expect(plist).toContain('<key>KeepAlive</key>');
		expect(plist).toContain('<key>StandardErrorPath</key>');
		expect(plist).toContain('<string>/tmp/proxy-dev-daemon.err</string>');
		expect(plist).toContain('<key>StandardOutPath</key>');
		expect(plist).toContain('<string>/tmp/proxy-dev-daemon.out</string>');
	});

	it('writes plist to file', () => {
		const plistPath = path.join(tmpDir, 'com.yaos-git.proxy-dev.plist');
		const nodePath = '/usr/local/bin/node';
		const scriptPath = '/opt/proxy-dev/daemon.js';

		writePlist(plistPath, nodePath, scriptPath);

		expect(fs.existsSync(plistPath)).toBe(true);

		const content = fs.readFileSync(plistPath, 'utf-8');
		expect(content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(content).toContain(`<string>${LABEL}</string>`);
		expect(content).toContain(`<string>${nodePath}</string>`);
		expect(content).toContain(`<string>${scriptPath}</string>`);
	});
});
