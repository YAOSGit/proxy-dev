const PROXY_DEV_MARKER = '# proxy-dev managed';
const PROXY_DEV_IP = '127.0.0.1';

const parseHostsFile = (content: string): string[] => {
	return content.split('\n').map((line) => line.trim());
};

const getProxyDevEntries = (content: string): string[] => {
	const entries: string[] = [];
	for (const line of content.split('\n')) {
		if (line.includes(PROXY_DEV_MARKER)) {
			const parts = line.trim().split(/\s+/);
			if (parts.length >= 2 && parts[1]) {
				entries.push(parts[1]);
			}
		}
	}
	return entries;
};

const addEntry = (content: string, domain: string): string => {
	// Don't add if already present
	if (getProxyDevEntries(content).includes(domain)) {
		return content;
	}

	const entry = `${PROXY_DEV_IP} ${domain} ${PROXY_DEV_MARKER}`;
	const trimmed = content.endsWith('\n') ? content : `${content}\n`;
	return `${trimmed + entry}\n`;
};

const removeEntry = (content: string, domain: string): string => {
	const lines = content.split('\n');
	const filtered = lines.filter((line) => {
		if (!line.includes(PROXY_DEV_MARKER)) return true;
		const parts = line.trim().split(/\s+/);
		return parts[1] !== domain;
	});
	return filtered.join('\n');
};

const removeAllProxyDevEntries = (content: string): string => {
	const lines = content.split('\n');
	const filtered = lines.filter((line) => !line.includes(PROXY_DEV_MARKER));
	return filtered.join('\n');
};

export {
	parseHostsFile,
	getProxyDevEntries,
	addEntry,
	removeEntry,
	removeAllProxyDevEntries,
	PROXY_DEV_MARKER,
	PROXY_DEV_IP,
};
