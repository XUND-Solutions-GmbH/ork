import { InternalServerErrorCode } from '../enums'
import { ORKError } from './ORKError'

/**
 * Error thrown when the external access config file cannot be loaded at startup,
 * either because it doesn't exist at the resolved path or because it isn't valid JSON.
 */
export class AccessConfigError extends ORKError {
  /**
   * @param configPath The path the access config was expected to be read from
   * @param reason The underlying error that caused the load to fail
   */
  constructor(configPath: string, reason: unknown) {
    const reasonMessage = reason instanceof Error ? reason.message : String(reason)
    const description = `Unable to load access config from '${configPath}': ${reasonMessage}`
    super('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.AccessConfigError, { description }, description)
  }
}
