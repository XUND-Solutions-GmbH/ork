import { ConfigService } from './config'
import { getLoggerWithScope, getLoggerForService } from './logger'

describe('Logger', () => {
  describe('Default', () => {
    it('getLoggerWithScope() should return a dummy logger with a scope for test env', () => {
      const scopeName = 'exampleScope'
      const logger = getLoggerWithScope(
        scopeName,
        new ConfigService({
          environment: 'TEST',
          port: Math.round(Math.random() * 9999) + 10000,
        }),
      )
      expect(logger.scope).toBe(scopeName)
    })

    it('getLoggerWithScope() should return a dummy logger with a scope for non-test env', () => {
      const scopeName = 'exampleScope'
      const logger = getLoggerWithScope(scopeName, new ConfigService())
      expect(logger.scope).toBe(scopeName)
    })

    it('getLoggerWithScope() should return a logger with a scope', () => {
      const scopeName = 'exampleScope'
      const logger = getLoggerWithScope(
        scopeName,
        new ConfigService({
          environment: 'TEST',
          port: Math.round(Math.random() * 9999) + 10000,
        }),
      )
      expect(logger.scope).toBe(scopeName)
    })

    it('getLoggerForService() should return a logger with a scope', () => {
      class ExampleService {}
      const instance = new ExampleService()
      const logger = getLoggerForService(
        instance,
        new ConfigService({
          environment: 'TEST',
          port: Math.round(Math.random() * 9999) + 10000,
        }),
      )
      expect(logger.scope).toBe(ExampleService.name)
    })
  })
})
