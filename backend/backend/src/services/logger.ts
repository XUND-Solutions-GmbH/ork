import { getDummyLogger, getConsoleLogger, Logger } from '../../../logger'
import { ConfigValues } from './config'

/**
 * Returns a Logger instance with a specified scope name
 * @param scope The service scope string
 * @param config The Configuration object
 * @returns The created Logger instance
 */
export const getLoggerWithScope = (scope: string, config: ConfigValues): Logger => {
  if (config?.environment === 'TEST') {
    return getDummyLogger(scope)
  }
  return getConsoleLogger(scope)
}

/**
/**
Returns a logger instance with a scope generated from a provided service's name
 * @param service The service instance (has to be a constructable class)
 * @param config The Configuration object
 * @returns the logger for the service instance
 */
export const getLoggerForService = (service: InstanceType<any>, config: ConfigValues) => {
  return getLoggerWithScope(service.constructor.name, config)
}
