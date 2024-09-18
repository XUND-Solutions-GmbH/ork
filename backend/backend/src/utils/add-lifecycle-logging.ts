import { DisposableService } from '../../../generic-utils'
import { Logger, colors } from '../../../logger'

/**
 * Adds lifecycle
 * @param service The service to decorate
 */
export const addLifecycleLogging = (service: DisposableService & { logger: Logger }) => {
  const oldInit = service.init.bind(service)
  service.init = async () => {
    const start = new Date()
    service.logger.debug({ message: 'Initializing...' })
    try {
      const returnValue = await oldInit()
      const end = new Date()
      const milliSeconds = end.getTime() - start.getTime()
      service.logger.debug({
        message: `Init finished in ${
          milliSeconds < 100 ? colors.fgGreen : milliSeconds < 1000 ? colors.fgYellow : colors.fgRed
        }${milliSeconds}${colors.reset} ms.`,
      })
      return returnValue
    } catch (error) {
      if (error instanceof Error) {
        service.logger.error({ message: 'Failed to initialize', error })
      }
      throw error
    }
  }
  const oldDispose = service.dispose.bind(service)
  service.dispose = async () => {
    service.logger.debug({ message: 'Disposing...' })
    try {
      const returnValue = await oldDispose()
      service.logger.debug({ message: 'Disposed.' })
      return returnValue
    } catch (error) {
      if (error instanceof Error) {
        service.logger.error({ message: 'Failed to dispose', error })
      }
      throw error
    }
  }
}

/**
 * @returns the updated class instance
 */
export const LogLifecycle =
  () =>
  <T extends { new (...args: any[]): DisposableService & { logger: Logger } }>(serviceConstructor: T) => {
    return class extends serviceConstructor {
      /**
       * @param args The constructor arguments
       */
      constructor(...args: any[]) {
        super(...args)
        addLifecycleLogging(this)
      }
    }
  }
