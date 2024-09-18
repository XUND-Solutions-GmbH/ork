/* eslint-disable require-jsdoc */
import { ErrorObject } from 'ajv'

/**
 * Custom Error class for Response schema errors
 */
export class ResponseSchemaError extends Error {
  constructor(public readonly errors: ErrorObject[]) {
    super('Response schema validation failed')
  }
}
