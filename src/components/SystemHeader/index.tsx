import { Box, Text } from 'ink';
import type { SystemHeaderProps } from './SystemHeader.types.js';

const formatUptime = (ms: number): string => {
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	const h = Math.floor(m / 60);
	if (h > 0) return `${h}h${m % 60}m`;
	if (m > 0) return `${m}m${s % 60}s`;
	return `${s}s`;
};

export function SystemHeader(props: SystemHeaderProps) {
	const { uptimeMs, hostCount, caTrusted, port, proxyStatus, lastError, configMode, version, configWarnings } = props;
	const statusColor = proxyStatus === 'running' ? 'green' : proxyStatus === 'error' ? 'red' : 'yellow';
	const modeColor = configMode === 'local' ? 'yellow' : configMode === 'global' ? 'cyan' : 'white';

	return (
		<Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
			<Box flexDirection="row" gap={2}>
				<Text bold color="cyan">
					proxy-dev <Text dimColor>v{version}</Text>
				</Text>
				<Text color="gray">|</Text>
				<Text>
					uptime: <Text color="green">{formatUptime(uptimeMs)}</Text>
				</Text>
				<Text color="gray">|</Text>
				<Text>
					port: <Text color="yellow">{port}</Text>
				</Text>
				<Text color="gray">|</Text>
				<Text>
					status: <Text color={statusColor}>{proxyStatus}</Text>
				</Text>
				<Text color="gray">|</Text>
				<Text>
					<Text color={hostCount > 0 ? 'green' : 'gray'}>●</Text> {hostCount} hosts
				</Text>
				<Text color="gray">|</Text>
				<Text color={caTrusted ? 'green' : 'red'}>
					CA: {caTrusted ? 'trusted' : 'not trusted'}
				</Text>
				<Text color="gray">|</Text>
				<Text color={modeColor} dimColor={configMode === 'merged'}>
					{configMode.toUpperCase()}
				</Text>
			</Box>
			{proxyStatus === 'error' && lastError && (
				<Box>
					<Text color="red">ERROR: {lastError}</Text>
				</Box>
			)}
			{configWarnings && configWarnings.length > 0 && (
				<Box>
					<Text color="yellow">CONFIG: {configWarnings[0]}</Text>
				</Box>
			)}
		</Box>
	);
}

export { formatUptime };
