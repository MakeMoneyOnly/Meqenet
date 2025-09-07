import App, { AppProps, AppContext } from 'next/app';
import Head from 'next/head';
import React, { Component, ErrorInfo, JSX, ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../libs/shared/src/i18n';
import { useAuthStore } from '../../../../libs/state-management/src/lib/auth-store';

import './styles.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for debugging purposes - in production, this should use a proper logging service
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, errorInfo);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return <h1>Sorry.. there was an error</h1>;
    }

    return this.props.children;
  }
}

function CustomApp({ Component, pageProps }: AppProps): JSX.Element {
  const { isAuthenticated, logout } = useAuthStore();

  // Register service worker for PWA functionality - service-worker registration
  useEffect(() => {
    // Use centralized environment check instead of direct process.env access
    const isProduction =
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1';

    if ('serviceWorker' in navigator && isProduction) {
      // Register service worker for PWA compliance
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => {
          // Service worker registered successfully
        })
        .catch(() => {
          // Service worker registration failed - fail silently in production
        });
    }
  }, []);

  return (
    <>
      <Head>
        <title>Welcome to Meqenet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="app">
        <ErrorBoundary>
          {isAuthenticated ? (
            <div className="flex justify-end p-4">
              <button
                onClick={() => logout()}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          ) : null}
          {i18n ? (
            <I18nextProvider i18n={i18n}>
              <Component {...pageProps} />
            </I18nextProvider>
          ) : (
            <Component {...pageProps} />
          )}
        </ErrorBoundary>
      </main>
    </>
  );
}

// Disable static optimization for i18n compatibility
CustomApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  return { ...appProps };
};

export default CustomApp;
