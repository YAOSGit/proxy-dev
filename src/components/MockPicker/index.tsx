import { Box, Text } from 'ink';
import type { MockPickerProps } from './MockPicker.types.js';

export function MockPicker({ routeKey, mockRoute, onSelect, onClose, selectedIndex = 0 }: MockPickerProps) {
    const variants = mockRoute ? Object.entries(mockRoute.variants) : [];
    const options = [...variants.map(([name, v]) => ({ name, status: v.status, file: v.file })), { name: 'Live', status: null, file: null }];
    const activeVariant = mockRoute?.active;

    return (
        <Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
            <Text bold color="cyan">Mock Picker — {routeKey}</Text>
            <Text color="gray">Select a variant or Live mode:</Text>
            <Box flexDirection="column" marginTop={1}>
                {options.map((opt, i) => {
                    const isActive = opt.name === 'Live' ? !activeVariant : opt.name === activeVariant;
                    const isSelected = i === selectedIndex;
                    return (
                        <Box key={opt.name} flexDirection="row" gap={2}>
                            <Text color={isSelected ? 'cyan' : 'gray'}>{isSelected ? '▸' : ' '}</Text>
                            <Text color={isActive ? 'green' : 'white'}>{isActive ? '●' : '○'}</Text>
                            <Text color={isSelected ? 'cyan' : 'white'}>{opt.name}</Text>
                            {opt.status !== null && <Text color="gray">({opt.status})</Text>}
                            {opt.file && <Text color="gray" dimColor>{opt.file}</Text>}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
}
