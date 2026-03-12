import { describe, expect, it } from 'vitest';
import {
	getCertsDir,
	getConfigDir,
	getDaemonPidPath,
	getDaemonSocketPath,
	getHostsPath,
	getLaunchdPlistPath,
	getPidPath,
} from './index.js';

describe('platform utils', () => {
	it('getConfigDir returns XDG or default path', () => {
		const dir = getConfigDir();
		expect(dir).toContain('proxy-dev');
	});

	it('getCertsDir is under config dir', () => {
		expect(getCertsDir()).toContain('certs');
	});

	it('getHostsPath returns platform hosts file', () => {
		const p = getHostsPath();
		expect(p).toMatch(/hosts/);
	});

	it('getPidPath is under config dir', () => {
		expect(getPidPath()).toContain('proxy-dev.pid');
	});

	it('getDaemonSocketPath returns path ending with daemon.sock', () => {
		const socketPath = getDaemonSocketPath();
		expect(socketPath).toContain('proxy-dev');
		expect(socketPath).toMatch(/daemon\.sock$/);
	});

	it('getDaemonPidPath returns path ending with daemon.pid', () => {
		const pidPath = getDaemonPidPath();
		expect(pidPath).toContain('proxy-dev');
		expect(pidPath).toMatch(/daemon\.pid$/);
	});

	it('getLaunchdPlistPath returns LaunchAgents path', () => {
		const plistPath = getLaunchdPlistPath();
		expect(plistPath).toContain('LaunchAgents');
		expect(plistPath).toMatch(/\.plist$/);
	});
});
