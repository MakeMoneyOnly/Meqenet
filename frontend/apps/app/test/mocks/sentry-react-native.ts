export const captureException = (_e: unknown): void => {
  // no-op in tests
};

export const init = (_opts: Record<string, unknown>): void => {
  // no-op
};

export default {
  captureException,
  init,
};
