export const PROXY_STATUS_COLORS: Record<string, string> = {
	running: 'green',
	error: 'red',
	starting: 'yellow',
};

export const CONFIG_MODE_COLORS: Record<string, string> = {
	local: 'yellow',
	global: 'cyan',
	merged: 'white',
};

export const UPTIME_COLOR = 'green' as const;
export const PORT_COLOR = 'yellow' as const;
export const SEPARATOR_COLOR = 'gray' as const;
export const HOST_ACTIVE_COLOR = 'green' as const;
export const HOST_INACTIVE_COLOR = 'gray' as const;
export const CA_TRUSTED_COLOR = 'green' as const;
export const CA_UNTRUSTED_COLOR = 'red' as const;
export const ERROR_TEXT_COLOR = 'red' as const;
export const WARNING_TEXT_COLOR = 'yellow' as const;
