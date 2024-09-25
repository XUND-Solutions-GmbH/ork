import { ORKError } from './ORKError'

export class ConfigurationError extends ORKError {
  /**
   * @param missingKeys The missing but required keys from the config
   * @param details Additional information about the error
   */
  constructor(missingKeys: Array<string | number>, details?: unknown) {
    const errorMessage = `The following required key(s) are missing from the environment: ${missingKeys.join(',')}`
    super('INTERNAL_SERVER_ERROR', undefined, undefined, { description: errorMessage, data: details })
  }
}
