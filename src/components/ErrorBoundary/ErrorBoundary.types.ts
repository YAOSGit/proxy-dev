import type { ReactNode } from 'react';

interface ErrorBoundaryProps {
	children: ReactNode;
	fallback?: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
	componentStack: string | null;
}

export type { ErrorBoundaryProps, ErrorBoundaryState };
