import { Box, Text } from 'ink';
import type { LatencyInputProps } from './LatencyInput.types.js';

export function LatencyInput({ currentMs, isGlobal, routeKey, onConfirm, onClose, inputValue, onInputChange }: LatencyInputProps) {
    const label = isGlobal ? 'Global Latency' : `Route Latency: ${routeKey ?? ''}`;

    return (
        <Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
            <Text bold color="cyan">{label}</Text>
            <Text color="gray">Current: {currentMs}ms</Text>
            <Box marginTop={1} flexDirection="row" gap={1}>
                <Text color="white">New value (ms):</Text>
                <Text color="cyan">{inputValue || '_'}</Text>
            </Box>
        </Box>
    );
}
