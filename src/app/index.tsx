import { ErrorBoundary } from '../components/ErrorBoundary/index.js';
import { AppProviders } from './providers.js';
import { AppContent } from './app.js';

export function App() {
	return (
		<ErrorBoundary>
			<AppProviders>
				<AppContent />
			</AppProviders>
		</ErrorBoundary>
	);
}
