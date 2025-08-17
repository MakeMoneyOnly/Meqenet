import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const DEFAULT_PORT = 3000;
  // Centralized env access for the backend app bootstrap
  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  const globalPrefix = 'api';
  return {
    port,
    globalPrefix,
  } as const;
});
