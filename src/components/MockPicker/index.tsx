import { Box, Text } from 'ink';
import {
	ACTIVE_VARIANT_COLOR,
	HEADING_COLOR,
	HINT_COLOR,
	INACTIVE_COLOR,
	META_COLOR,
	NORMAL_TEXT_COLOR,
	POINTER_COLOR,
} from './MockPicker.consts.js';
import type { MockPickerProps } from './MockPicker.types.js';

export function MockPicker({
	routeKey,
	mockRoute,
	onSelect: _onSelect,
	onClose: _onClose,
	selectedIndex = 0,
}: MockPickerProps) {
	const variants = mockRoute ? Object.entries(mockRoute.variants) : [];
	const options = [
		...variants.map(([name, v]) => ({ name, status: v.status, file: v.file })),
		{ name: 'Live', status: null, file: null },
	];
	const activeVariant = mockRoute?.active;

	return (
		<Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
			<Text bold color={HEADING_COLOR}>
				Mock Picker — {routeKey}
			</Text>
			<Text color={HINT_COLOR}>Select a variant or Live mode:</Text>
			<Box flexDirection="column" marginTop={1}>
				{options.map((opt, i) => {
					const isActive =
						opt.name === 'Live' ? !activeVariant : opt.name === activeVariant;
					const isSelected = i === selectedIndex;
					return (
						<Box key={opt.name} flexDirection="row" gap={2}>
							<Text color={isSelected ? POINTER_COLOR : INACTIVE_COLOR}>
								{isSelected ? '▸' : ' '}
							</Text>
							<Text color={isActive ? ACTIVE_VARIANT_COLOR : NORMAL_TEXT_COLOR}>
								{isActive ? '●' : '○'}
							</Text>
							<Text color={isSelected ? POINTER_COLOR : NORMAL_TEXT_COLOR}>
								{opt.name}
							</Text>
							{opt.status !== null && (
								<Text color={META_COLOR}>({opt.status})</Text>
							)}
							{opt.file && (
								<Text color={META_COLOR} dimColor>
									{opt.file}
								</Text>
							)}
						</Box>
					);
				})}
			</Box>
		</Box>
	);
}
