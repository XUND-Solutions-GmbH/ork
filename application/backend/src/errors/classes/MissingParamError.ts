import { ORKError } from './ORKError'

/**
 * Generic error when an object is not found
 */
export class MissingParamError extends ORKError {
  /**
   * @param param Parameter that was missing, only provides one
   * @param area Area that required target information
   */
  constructor(param: string, area?: string) {
    super('BAD_REQUEST', 'MISSING_PARAM', undefined, {
      description: `Parameter ${param} needed to authorize${area ? area : ''}`,
      data: param,
    })
  }
}
