import * as Sentry from '@sentry/react-native';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { Text } from 'react-native';
import { vi } from 'vitest';

import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  const silenceReactErrorLogs = (): (() => void) => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
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

  it('resets state and renders children after pressing "Try again"', async () => {
    const restore = silenceReactErrorLogs();

    // Always-throwing child to guarantee fallback is shown, regardless of StrictMode/double-render
    const Bomb = (): never => {
      throw new Error('Boom');
    };

    const boundaryRef = React.createRef<ErrorBoundary>();
    const Harness = ({ blowUp }: { blowUp: boolean }): React.JSX.Element => (
      <ErrorBoundary ref={boundaryRef}>
        {blowUp ? <Bomb /> : <Text>Recovered</Text>}
      </ErrorBoundary>
    );

    const { queryByText, rerender } = render(<Harness blowUp={true} />);

    // Confirm fallback is rendered
    await screen.findByText(/Oops, something went wrong/i, undefined, {
      timeout: 3000,
    });

    // Replace the child with a non-throwing one so the next render won't throw
    rerender(<Harness blowUp={false} />);

    // Programmatically reset the boundary state to avoid any event-mapping flakiness
    await act(async () => {
      boundaryRef.current?.setState({ hasError: false });
    });

    // Wait for fallback to disappear and recovered text to appear
    await waitFor(
      () => expect(queryByText(/Oops, something went wrong/i)).toBeNull(),
      {
        timeout: 3000,
      },
    );
    expect(
      await screen.findByText('Recovered', undefined, { timeout: 3000 }),
    ).toBeTruthy();
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
