import fs from 'node:fs';

const LABEL = 'com.yaos-git.proxy-dev';

const generatePlist = (nodePath: string, daemonScriptPath: string): string => {
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
): void => {
	const plist = generatePlist(nodePath, daemonScriptPath);
	fs.writeFileSync(plistPath, plist, 'utf-8');
};

export { LABEL, generatePlist, writePlist };
