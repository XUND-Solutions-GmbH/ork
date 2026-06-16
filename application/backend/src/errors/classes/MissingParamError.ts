import { ORKError } from './ORKError'

/**
 * Generic error when an object is not found
 */
export class MissingParamError extends ORKError {
  /**
   * @param area Area that required target information
   * @param param Parameter that was missing, only provides one
   */
  constructor(area: string, param: string) {
    super('BAD_REQUEST', 'MISSING_PARAM', undefined, {
      description: `Parameter ${param} needed to authorize in ${area}`,
      data: param,
    })
  }
}
