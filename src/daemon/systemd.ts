const SERVICE_NAME = 'proxy-dev-daemon';

/**
 * systemd unit for the hosts daemon (Linux twin of the macOS LaunchDaemon): runs as root
 * (it edits /etc/hosts and binds 443/80), Restart=always heals crashes, enable --now covers
 * boot. PROXY_DEV_SOCKET is baked in because system services have no user HOME — without it
 * the socket would land under /root and the user's CLI could never find it.
 */
const generateUnit = (
	nodePath: string,
	daemonScriptPath: string,
	socketPath: string,
): string => {
	return `[Unit]
Description=proxy-dev hosts daemon
After=network.target

[Service]
ExecStart=${nodePath} ${daemonScriptPath}
Environment=PROXY_DEV_SOCKET=${socketPath}
Restart=always
RestartSec=1

[Install]
WantedBy=multi-user.target
`;
};

export { generateUnit, SERVICE_NAME };
