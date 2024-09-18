import { Logger } from '../logger'

/**
 * @param scope The Scope name
 * @returns a logger implementation that bypasses the messages to prevent test log pollution
 */
export const getDummyLogger = (scope: string) =>
  ({
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
    scope,
  } as Logger)
