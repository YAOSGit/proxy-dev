import fs from 'node:fs';

const LABEL = 'com.yaos-git.proxy-dev';

/**
 * Root LaunchDaemon plist (/Library/LaunchDaemons): the daemon needs root for /etc/hosts,
 * and KeepAlive + RunAtLoad make launchd restart it after crashes and start it at boot —
 * install once, never run `daemon start` again. PROXY_DEV_SOCKET is baked in because
 * launchd provides no user HOME: without it the daemon would put its socket under
 * /var/root and the user's CLI could never find it.
 */
const generatePlist = (
	nodePath: string,
	daemonScriptPath: string,
	socketPath: string,
): string => {
	return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>${LABEL}</string>
	<key>ProgramArguments</key>
	<array>
		<string>${nodePath}</string>
		<string>${daemonScriptPath}</string>
	</array>
	<key>EnvironmentVariables</key>
	<dict>
		<key>PROXY_DEV_SOCKET</key>
		<string>${socketPath}</string>
	</dict>
	<key>RunAtLoad</key>
	<true/>
	<key>KeepAlive</key>
	<true/>
	<key>StandardErrorPath</key>
	<string>/tmp/proxy-dev-daemon.err</string>
	<key>StandardOutPath</key>
	<string>/tmp/proxy-dev-daemon.out</string>
</dict>
</plist>
`;
};

const writePlist = (
	plistPath: string,
	nodePath: string,
	daemonScriptPath: string,
	socketPath: string,
): void => {
	const plist = generatePlist(nodePath, daemonScriptPath, socketPath);
	fs.writeFileSync(plistPath, plist, 'utf-8');
};

export { generatePlist, LABEL, writePlist };
