import { ErrorBoundary } from '@frontend/shared/ui';
import { AppProps } from 'next/app';
import Head from 'next/head';
import React, { JSX } from 'react';
import './styles.css';

function CustomApp({ Component, pageProps }: AppProps): JSX.Element {
  return (
    <>
      <Head>
        <title>Welcome to website!</title>
      </Head>
      <main className="app">
        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
      </main>
    </>
  );
}

export default CustomApp;
