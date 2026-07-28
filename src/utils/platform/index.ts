import os from 'node:os';
import path from 'node:path';

const getConfigDir = (): string => {
	const xdg = process.env.XDG_CONFIG_HOME;
	const base = xdg || path.join(os.homedir(), '.config');
	return path.join(base, 'proxy-dev');
};

const getCertsDir = (): string => path.join(getConfigDir(), 'certs');

const getLeavesDir = (): string => path.join(getCertsDir(), 'leaves');

const getHostsPath = (): string =>
	process.platform === 'win32'
		? 'C:\\Windows\\System32\\drivers\\etc\\hosts'
		: '/etc/hosts';

const getPidPath = (): string => path.join(getConfigDir(), 'proxy-dev.pid');

const getGlobalConfigPath = (): string =>
	path.join(getConfigDir(), 'config.json');

const getDaemonSocketPath = (): string =>
	path.join(getConfigDir(), 'daemon.sock');

const getDaemonPidPath = (): string => path.join(getConfigDir(), 'daemon.pid');

const getSystemdUnitPath = (): string =>
	path.join('/etc', 'systemd', 'system', 'proxy-dev-daemon.service');

// Root LaunchDaemon, NOT a user LaunchAgent: the daemon edits /etc/hosts, so it must run
// as root — and only system-domain daemons get KeepAlive across crashes and boot.
const getLaunchdPlistPath = (): string =>
	path.join('/Library', 'LaunchDaemons', 'com.yaos-git.proxy-dev.plist');

export {
	getCertsDir,
	getConfigDir,
	getDaemonPidPath,
	getDaemonSocketPath,
	getGlobalConfigPath,
	getHostsPath,
	getLaunchdPlistPath,
	getSystemdUnitPath,
	getLeavesDir,
	getPidPath,
};
