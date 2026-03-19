import { Box, Text } from 'ink';
import type React from 'react';
import { Component } from 'react';
import { theme } from '../../theme.js';
import type {
	ErrorBoundaryProps,
	ErrorBoundaryState,
} from './ErrorBoundary.types.js';

export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = {
		hasError: false,
		error: null,
		componentStack: null,
	};

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('[ErrorBoundary] Uncaught error:', error);
		if (errorInfo.componentStack) {
			this.setState({ componentStack: errorInfo.componentStack });
			console.error(
				'[ErrorBoundary] Component stack:',
				errorInfo.componentStack,
			);
		}
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback ?? (
					<Box
						flexDirection="column"
						borderStyle="round"
						borderColor={theme.error}
						paddingX={1}
						paddingY={1}
					>
						<Text bold color={theme.error}>
							Something went wrong
						</Text>
						<Box marginTop={1}>
							<Text color={theme.warning}>{this.state.error?.message}</Text>
						</Box>
						{this.state.componentStack && (
							<Box marginTop={1} flexDirection="column">
								<Text bold dimColor>
									Stack:
								</Text>
								<Text dimColor>
									{this.state.componentStack
										.trim()
										.split('\n')
										.slice(0, 5)
										.join('\n')}
								</Text>
							</Box>
						)}
						<Box marginTop={1}>
							<Text dimColor>
								Press 'q' to quit. Full details logged to stderr.
							</Text>
						</Box>
					</Box>
				)
			);
		}
		return this.props.children;
	}
}
