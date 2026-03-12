import { Box, Text } from 'ink';
import type { ConfirmDialogProps } from './ConfirmDialog.types.js';

export function ConfirmDialog({ message }: ConfirmDialogProps) {
	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="yellow"
			paddingX={1}
			paddingY={0}
		>
			<Text color="yellow" bold>
				{message}
			</Text>
			<Box marginTop={1} gap={2}>
				<Text>
					<Text color="green" bold>
						[y]
					</Text>{' '}
					yes
				</Text>
				<Text>
					<Text color="red" bold>
						[n]
					</Text>{' '}
					no
				</Text>
			</Box>
		</Box>
	);
}
