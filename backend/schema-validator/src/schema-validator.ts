/* eslint-disable require-jsdoc */
import Ajv, { ErrorObject, Options, ValidateFunction } from 'ajv'
import useFormats from 'ajv-formats'
import { JTDDataType } from 'ajv/dist/core'
import { ResponseSchemaError } from './response-schema-error'
import { SchemaValidationError } from './schema-validation-error'

export class SchemaValidator<TSchema extends { definitions: {} }> {
  private readonly ajv = new Ajv({
    allErrors: true,
    ...this.ajvOptions,
  })
  constructor(private readonly schema: TSchema, private readonly ajvOptions?: Options) {
    useFormats(this.ajv)
  }

  private readonly schemaValidatorFnCache = new Map<string, ValidateFunction<JTDDataType<any>>>()

  private getValidatorFn(schemaName: string) {
    const validatorFromCache = this.schemaValidatorFnCache.get(schemaName)
    if (!validatorFromCache) {
      const schema = { ...this.schema, $ref: `#/definitions/${schemaName}` }
      const validatorFn = this.ajv.compile(schema)
      this.schemaValidatorFnCache.set(schemaName, validatorFn)
      return validatorFn
    }
    return validatorFromCache
  }

  /**
   * @param data The object to validate
   * @param options Options for the schema validation
   * @param options.schemaName The name of the type in the Schema Definitions
   * @param error The error object if validation fails
   * @throws SchemaValidationError when the validation has been failed
   * @returns true in case of validation success
   */
  public isValid<T>(
    data: unknown,
    options: { schemaName: keyof TSchema['definitions'] },
    error: typeof SchemaValidationError | typeof ResponseSchemaError = SchemaValidationError,
  ): data is T {
    const validatorFn = this.getValidatorFn(options.schemaName as string)
    const isValid = validatorFn(data)
    if (!isValid) {
      throw new error(validatorFn.errors as ErrorObject[])
    }
    return true
  }

  /**
   * Use this function to validate schemas without throwing an error
   * @param data The object to validate
   * @param options Options for the schema validation
   * @param options.schemaName The name of the type in the Schema Definitions
   * @returns true or false depending on the result of validation
   */
  public isValidPure(data: any, options: { schemaName: keyof TSchema['definitions'] }): boolean {
    const validatorFn = this.getValidatorFn(options.schemaName as string)
    const isValid = validatorFn(data)
    return isValid
  }
}
