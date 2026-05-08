import { Box, Text } from 'ink';
import { theme } from '../../theme.js';
import {
	formatLatency,
	formatMethod,
	formatRouteState,
	formatStatus,
} from '../../utils/format/index.js';
import {
	DOMAIN_COLOR,
	EMPTY_STATE_COLOR,
	LATENCY_COLOR,
	PATH_COLOR,
} from './TrafficTable.consts.js';
import type { TrafficTableProps } from './TrafficTable.types.js';

export function TrafficTable({
	entries,
	selectedIndex,
	height,
	domains,
}: TrafficTableProps) {
	if (entries.length === 0) {
		const hint =
			domains && domains.length > 0 ? `Try: curl https://${domains[0]}` : '';
		return (
			<Box
				flexGrow={1}
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
				gap={1}
			>
				<Text color={EMPTY_STATE_COLOR}>Waiting for requests...</Text>
				{hint && <Text dimColor>{hint}</Text>}
			</Box>
		);
	}

	// Calculate visible window
	const visibleCount = Math.max(1, height - 2);
	const startIdx = Math.max(
		0,
		Math.min(
			selectedIndex - Math.floor(visibleCount / 2),
			entries.length - visibleCount,
		),
	);
	const visible = entries.slice(startIdx, startIdx + visibleCount);

	return (
		<Box flexDirection="column" flexGrow={1}>
			{visible.map((entry, i) => {
				const globalIdx = startIdx + i;
				const isSelected = globalIdx === selectedIndex;
				return (
					<Box key={entry.id} flexDirection="row" gap={1} paddingX={1}>
						<Text
							color={isSelected ? theme.brand : undefined}
							bold={isSelected}
						>
							{isSelected ? '▸' : ' '}
						</Text>
						<Text bold={isSelected}>{formatMethod(entry.method)}</Text>
						<Text bold={isSelected}>{formatStatus(entry.status)}</Text>
						<Text color={DOMAIN_COLOR}>{entry.domain}</Text>
						<Text color={PATH_COLOR} bold={isSelected}>
							{entry.path}
						</Text>
						<Text color={LATENCY_COLOR}>{formatLatency(entry.latencyMs)}</Text>
						<Text>{formatRouteState(entry.routeState)}</Text>
					</Box>
				);
			})}
		</Box>
	);
}
