import {
  IntegrationErrorType,
  InternalServerErrorCode,
  HttpErrorType,
  httpErrorCodeFor,
  httpErrorNameFor,
} from '../enums'
import { ErrorDetails, ErrorResponse } from '../models'
export class ORKError extends Error {
  httpType: HttpErrorType = 'INTERNAL_SERVER_ERROR'
  integrationErrorType?: IntegrationErrorType
  internalServerErrorCode?: InternalServerErrorCode
  details?: ErrorDetails

  /**
   * OKR Error constructor
   * @param httpType Standard HTTP error type. It determines the status code
   * @param integrationErrorType Use when the API is not used properly, and the error is caused by frontend
   * @param internalServerErrorCode Use when the error is caused by a backend bug
   * @param details  Error related data
   * @param customErrorDescription Error description to set as message for super Error's constructor
   */
  constructor(
    httpType: HttpErrorType,
    integrationErrorType?: IntegrationErrorType,
    internalServerErrorCode?: InternalServerErrorCode,
    details?: ErrorDetails,
    customErrorDescription?: string,
  ) {
    super(
      customErrorDescription ||
        `HTTPType: ${httpType}\ncustomErrorType: ${integrationErrorType || '-'}\nCustom error code:${
          internalServerErrorCode || '-'
        }`,
    )
    this.httpType = httpType
    this.integrationErrorType = integrationErrorType
    this.internalServerErrorCode = internalServerErrorCode
    this.details = details
  }

  /**
   * Create internally intended errors
   * @param internalServerErrorCode The error code that identifies the reason behind internal server error
   * @param details More details about the error
   * @param customErrorDescription Description for super constructor parameter. If not provided, another message will be composed from the other parameters
   * @returns  ORKError property initialized for client side errors
   */
  public static internalServerError(
    internalServerErrorCode: InternalServerErrorCode,
    details?: ErrorDetails,
    customErrorDescription?: string,
  ): ORKError {
    return new this('INTERNAL_SERVER_ERROR', undefined, internalServerErrorCode, details, customErrorDescription)
  }

  /**
   * Create errors for notifying clients about potential api integration issues on their side
   * @param httpErrorType HttpErrorType of the issue
   * @param integrationErrorType Backend specific issue type (e.g. INVALID_PARAMETERS, MISSING_API_KEY, etc.)
   * @param details More information about the error
   * @param customErrorDescription Description for super constructor parameter. If not provided, another message will be composed from the other parameters
   * @returns a ORKError properly initialized for internal errors
   */
  public static integrationError(
    httpErrorType: HttpErrorType,
    integrationErrorType: IntegrationErrorType,
    details?: ErrorDetails,
    customErrorDescription?: string,
  ): ORKError {
    return new this(httpErrorType, integrationErrorType, undefined, details, customErrorDescription)
  }

  /**
   * This function converts the object to a proper response object
   * @returns Error as sendable response object
   */
  public get errorResponseObject(): ErrorResponse {
    const responseObject: ErrorResponse = {
      error: httpErrorNameFor(this.httpType),
    }
    if (this.integrationErrorType) {
      responseObject.integrationErrorType = this.integrationErrorType
    }
    if (this.internalServerErrorCode) {
      responseObject.internalServerErrorCode = this.internalServerErrorCode
    }
    if (this.details) {
      responseObject.details = this.details
    }
    return responseObject
  }

  /**
   * @returns Status code that belongs to this error.
   */
  public get statusCode() {
    return httpErrorCodeFor(this.httpType)
  }
}
