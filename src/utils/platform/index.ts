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

const getGlobalConfigPath = (): string => path.join(getConfigDir(), 'config.json');

const getDaemonSocketPath = (): string => path.join(getConfigDir(), 'daemon.sock');

const getDaemonPidPath = (): string => path.join(getConfigDir(), 'daemon.pid');

const getLaunchdPlistPath = (): string =>
	path.join(os.homedir(), 'Library', 'LaunchAgents', 'com.yaos-git.proxy-dev.plist');

export { getConfigDir, getCertsDir, getLeavesDir, getHostsPath, getPidPath, getGlobalConfigPath, getDaemonSocketPath, getDaemonPidPath, getLaunchdPlistPath };
