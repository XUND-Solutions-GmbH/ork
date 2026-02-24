const integrationErrorTypes = [
  /**
   * Request validation failed according to our defined rules
   */
  'INVALID_REQUEST',
  /**
   * No api key received or it is invalid
   */
  'INVALID_API_KEY',
  /**
   * No api key received or it is invalid
   */
  'MISSING_API_KEY',
  /**
  * No target received or it is invalid
  */
  'MISSING_PARAM',
] as const

/**
 * Use CustomErrorType when an invalid client integration caused an issue
 * e.g: Invalid parameter received from client --> client side issue
 */
export type IntegrationErrorType = (typeof integrationErrorTypes)[number]
