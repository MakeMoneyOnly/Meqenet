import * as Sentry from '@sentry/react-native';
import { render, fireEvent, screen } from '@testing-library/react';
import React from 'react';
import { Text } from 'react-native';
import { vi } from 'vitest';

import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  const silenceReactErrorLogs = (): (() => void) => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    return () => spy.mockRestore();
  };

  it('renders fallback UI when a child throws', () => {
    const restore = silenceReactErrorLogs();

    const Bomb = (): never => {
      throw new Error('Boom');
    };

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByText(/Oops, something went wrong/i)).toBeTruthy();
    restore();
  });

  it('resets state and renders children after pressing "Try again"', () => {
    const restore = silenceReactErrorLogs();

    const OneTimeBomb = (): React.JSX.Element => {
      const thrown = React.useRef(false);
      if (!thrown.current) {
        thrown.current = true;
        throw new Error('Boom once');
      }
      return <Text>Recovered</Text>;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <OneTimeBomb />
      </ErrorBoundary>,
    );

    expect(getByText(/Oops, something went wrong/i)).toBeTruthy();

    fireEvent.click(getByText(/Try again/i));

    expect(getByText('Recovered')).toBeTruthy();

    restore();
  });

  it('calls Sentry.captureException when errors occur', () => {
    const restore = silenceReactErrorLogs();

    const sentrySpy = vi.spyOn(Sentry, 'captureException');

    const Bomb = (): never => {
      throw new Error('Crash for Sentry');
    };

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(sentrySpy).toHaveBeenCalledTimes(1);
    const arg = sentrySpy.mock.calls[0][0];
    expect(arg).toBeInstanceOf(Error);

    restore();
  });
});
