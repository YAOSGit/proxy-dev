import { ErrorBoundary } from '../components/ErrorBoundary/index.js';
import { AppContent } from './app.js';
import { AppProviders } from './providers.js';

export function App() {
	return (
		<ErrorBoundary>
			<AppProviders>
				<AppContent />
			</AppProviders>
		</ErrorBoundary>
	);
}
