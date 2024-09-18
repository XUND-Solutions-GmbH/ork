import { InternalServerErrorCode, IntegrationErrorType, HttpErrorType } from '../enums'
import { ErrorDetails } from './ErrorDetails'

/**
 * This interface defines the response's structure sent to client when error happened
 */
export interface ErrorResponse {
  /**
   * Standard HTTP error's name
   */
  error: HttpErrorType

  /**
   * If the error was probably caused by the client, this value describes its type
   */
  integrationErrorType?: IntegrationErrorType

  /**
   * If the error was probably caused by the an issue on backend side, this value describes its type
   */
  internalServerErrorCode?: InternalServerErrorCode

  /**
   * Further error details if available
   */
  details?: ErrorDetails
}
