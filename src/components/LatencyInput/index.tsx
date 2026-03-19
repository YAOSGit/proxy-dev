import { Box, Text } from 'ink';
import {
	HEADING_COLOR,
	HINT_COLOR,
	INPUT_COLOR,
	LABEL_COLOR,
} from './LatencyInput.consts.js';
import type { LatencyInputProps } from './LatencyInput.types.js';

export function LatencyInput({
	currentMs,
	isGlobal,
	routeKey,
	onConfirm: _onConfirm,
	onClose: _onClose,
	inputValue,
	onInputChange: _onInputChange,
}: LatencyInputProps) {
	const label = isGlobal
		? 'Global Latency'
		: `Route Latency: ${routeKey ?? ''}`;

	return (
		<Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
			<Text bold color={HEADING_COLOR}>
				{label}
			</Text>
			<Text color={HINT_COLOR}>Current: {currentMs}ms</Text>
			<Box marginTop={1} flexDirection="row" gap={1}>
				<Text color={LABEL_COLOR}>New value (ms):</Text>
				<Text color={INPUT_COLOR}>{inputValue || '_'}</Text>
			</Box>
		</Box>
	);
}
