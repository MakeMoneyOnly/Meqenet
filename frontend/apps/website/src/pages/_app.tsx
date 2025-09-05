import { AppProps } from 'next/app';
import App from 'next/app';
import Head from 'next/head';
import React, { Component, ErrorInfo, JSX, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../../libs/shared/src/i18n';

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

  public static getDerivedStateFromError(_: Error): ErrorBoundaryState {
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
  return (
    <>
      <Head>
        <title>Welcome to Meqenet</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="app">
        <ErrorBoundary>
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
CustomApp.getInitialProps = async (appContext: any) => {
  const appProps = await (App as any).getInitialProps?.(appContext);
  return { ...appProps };
};

export default CustomApp;
