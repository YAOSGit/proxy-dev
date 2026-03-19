import { Box, Text } from 'ink';
import { theme } from '../../theme.js';
import type { ConfirmDialogProps } from './ConfirmDialog.types.js';

export function ConfirmDialog({ message }: ConfirmDialogProps) {
	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={theme.warning}
			paddingX={1}
			paddingY={0}
		>
			<Text color={theme.warning} bold>
				{message}
			</Text>
			<Box marginTop={1} gap={2}>
				<Text>
					<Text color={theme.success} bold>
						[y]
					</Text>{' '}
					yes
				</Text>
				<Text>
					<Text color={theme.error} bold>
						[n]
					</Text>{' '}
					no
				</Text>
			</Box>
		</Box>
	);
}
