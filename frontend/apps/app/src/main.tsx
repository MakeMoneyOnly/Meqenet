import * as Sentry from '@sentry/react-native';
import { AppRegistry } from 'react-native';

import App from './app/App';

Sentry.init({
  dsn: '__SENTRY_DSN__',
  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production.
  tracesSampleRate: 1.0,
});

AppRegistry.registerComponent('App', () => Sentry.wrap(App));
