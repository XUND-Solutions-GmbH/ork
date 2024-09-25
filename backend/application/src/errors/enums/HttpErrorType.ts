/**
 * Standard HTTP error type. It determines the status code
 */
const httpErrorTypes = [
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'NOT_ACCEPTABLE',
  'CONFLICT',
  'GONE',
  'PRECONDITION_FAILED',
  'EXPECTATION_FAILED',
  'INTERNAL_SERVER_ERROR',
  'FAILED_DEPENDENCY',
]

export type HttpErrorType = (typeof httpErrorTypes)[number]

/**
 * Object that includes translation between HttpErrorType values and their readable names
 */
const errorNames: { [key: HttpErrorType]: string } = {
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  NOT_ACCEPTABLE: 'Not Acceptable',
  CONFLICT: 'Conflict',
  GONE: 'Gone',
  PRECONDITION_FAILED: 'Precondition Failed',
  EXPECTATION_FAILED: 'Expectation Failed',
  FAILED_DEPENDENCY: 'Failed Dependency',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
} as const

/**
 * Object that includes translation between HttpErrorType values and their HTTP status codes
 */
const errorCodes: { [key: HttpErrorType]: number } = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  NOT_ACCEPTABLE: 406,
  CONFLICT: 409,
  GONE: 410,
  PRECONDITION_FAILED: 412,
  EXPECTATION_FAILED: 417,
  FAILED_DEPENDENCY: 424,
  INTERNAL_SERVER_ERROR: 500,
} as const

/**
 * Provides the standard name for HttpErrorType enum
 * @param type The enum to 'convert' to http error name
 * @returns The name of the error
 */
export function httpErrorNameFor(type: HttpErrorType) {
  const defaultHttpErrorName = 'Internal Server Error'
  return errorNames[type] || defaultHttpErrorName
}

/**
 * Provides a standard status code for HttpErrorType enum
 * @param type The enum to 'convert' to http status code
 * @returns The standard http error code
 */
export function httpErrorCodeFor(type: HttpErrorType) {
  const defaultHttpErrorCode = 500
  return errorCodes[type] || defaultHttpErrorCode
}
