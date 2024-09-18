import { ORKError } from './ORKError'

/**
 * Generic error when an object is not found
 */
export class NotFoundError extends ORKError {
  /**
   * @param resource Information about not found resource
   * @param details Additional information about the error
   */
  constructor(resource: string, details?: unknown) {
    super('NOT_FOUND', undefined, undefined, { description: `Not found resource: ${resource}`, data: details })
  }
}
