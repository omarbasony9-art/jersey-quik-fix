import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/react';
import { dark } from '@clerk/themes';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

createRoot(document.getElementById('root')!, {
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    {publishableKey ? (
      <ClerkProvider publishableKey={publishableKey} appearance={{ baseTheme: dark }}>
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </ErrorBoundary>,
);
