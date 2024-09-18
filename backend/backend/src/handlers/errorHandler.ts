import { ErrorRequestHandler } from 'express'
import { AxiosError } from 'axios'
import { SchemaValidationError } from '../../../schema-validator'
import { Logger } from '../../../logger'
import { ConfigValues } from '../services'
import { InternalServerErrorCode, ORKError } from '../errors'

/**
 * @param options The Options object
 * @param options.logger The Logger instance
 * @param options.onError Optional callback for errors
 * @param options.config The related configuration object
 * @returns The created Error middleware
 */
export const createErrorHandler =
  (options: { logger: Logger; onError?: (err: Error) => void; config: ConfigValues }): ErrorRequestHandler =>
  (err, _req, res, _next) => {
    options.onError && options.onError(err)

    if (err instanceof SchemaValidationError) {
      const error = ORKError.integrationError('BAD_REQUEST', 'INVALID_REQUEST', {
        description: 'Schema validation errors. Check data for exact error description',
        data: err,
      })
      return res.status(error.statusCode).send(error.errorResponseObject)
    }

    if (err instanceof ORKError) {
      // Common error details
      const error = err
      let errorMessage = 'ORKError'
      if (error.internalServerErrorCode) {
        errorMessage = `${errorMessage} ${error.internalServerErrorCode}:  ${err.toString()}`
      } else {
        errorMessage = `${errorMessage}:  ${err.toString()}`
      }
      const errorDetails = {
        internalServerErrorCode: err.internalServerErrorCode,
        integrationErrorType: err.integrationErrorType,
        httpType: err.httpType,
        statusCode: err.statusCode,
      }
      // If internal server error -> verbosity is error
      if (error.internalServerErrorCode) {
        options.logger.error({
          error,
          message: errorMessage,
          orkError: errorDetails,
          apiKey: _req?.header('api-key'),
        })
      } else {
        // If not XRE error -> verbosity is warn
        options.logger.warn({
          error,
          message: errorMessage,
          orkError: errorDetails,
          apiKey: _req?.header('api-key'),
        })
      }
      return res.status(err.statusCode).send(err.errorResponseObject)
    } else if ((err as AxiosError).response) {
      // AXIOS error -> can mean problems with other components
      const axiosError = err as AxiosError
      const orkError = ORKError.internalServerError(InternalServerErrorCode.AnyInternalConnectionError, {
        description: 'Internal communication error',
        data: { internalCode: axiosError.code },
      })
      options.logger.error({
        message: `AxiosError: ${err.toString()}`,
        error: {
          message: err.message,
          stack: err.stack,
          name: err.name,
        },
        responseData: axiosError.response?.data,
        apiKey: _req?.header('api-key'),
        orkError: {
          internalServerErrorCode: err.internalServerErrorCode,
          integrationErrorType: err.integrationErrorType,
          httpType: err.httpType,
          statusCode: err.statusCode,
        },
      })
      return res.status(orkError.statusCode).send(orkError.errorResponseObject)
    } else {
      //Unhandled errors
      options.logger.error({
        message: `Uncaught Error: ${err.toString()}`,
        error: err,
        apiKey: _req?.header('api-key'),
      })

      const unknownError = ORKError.internalServerError(InternalServerErrorCode.UnknownError, {
        data: { code: err instanceof Error ? err.name : '-' },
      })
      return res.status(unknownError.statusCode).send(unknownError.errorResponseObject)
    }
  }
