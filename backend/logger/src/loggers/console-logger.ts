import { Logger } from '../logger'

export const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  fgBlack: '\x1b[30m',
  fgRed: '\x1b[31m',
  fgGreen: '\x1b[32m',
  fgYellow: '\x1b[33m',
  fgBlue: '\x1b[34m',
  fgMagenta: '\x1b[35m',
  fgCyan: '\x1b[36m',
  fgWhite: '\x1b[37m',
}

/**
 * @param scope The scope name
 * @returns a logger instance for the selected scope
 */
export const getConsoleLogger = (scope: string) =>
  ({
    scope,
    debug: (entry) =>
      console.log(`${colors.fgCyan} [${new Date().toISOString()}]${colors.reset} ${scope} >`, entry.message),
    info: (entry) =>
      console.log(`${colors.fgGreen} [${new Date().toISOString()}]${colors.reset} ${scope} >`, entry.message),
    warn: (entry) =>
      console.warn(`${colors.fgYellow} [${new Date().toISOString()}]${colors.reset} ${scope} >`, entry.message),
    error: (entry) =>
      console.error(
        `${colors.fgRed} [${new Date().toISOString()}]${colors.reset} ${scope} >`,
        entry.message,
        entry.error,
      ),
  } as Logger)
