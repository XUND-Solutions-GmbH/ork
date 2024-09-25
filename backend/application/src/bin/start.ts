import { ConfigService, getLoggerWithScope, ORKWeb } from '../services'
import { ORKApplication } from '../app'

const config = new ConfigService()
const mainLogger = getLoggerWithScope('Main', config)

mainLogger.info({ message: 'ORK starting...' })

const web = new ORKWeb({ config })
const app = new ORKApplication(config, web)

/**
 * @param param0 The provided options
 * @param param0.errorCode Error code, 0 when there is no error
 * @param param0.reason The reject reason in case of unhandled rejection
 * @param param0.error The error object in case of uncaught error
 */
const shutdown = async ({ errorCode, reason, error }: { errorCode: number; reason: string; error?: Error }) => {
  if (errorCode) {
    mainLogger.error({
      message: `Something bad happened. Shutting down with error code '${errorCode}' and reason '${reason}`,
      error: error || new Error(`unknown error with code: ${errorCode} at shutdown`),
    })
  } else {
    mainLogger.info({ message: `Shutting down gracefully with reason '${reason}'` })
  }
  try {
    await app.dispose()
  } finally {
    console.log('Bye. \n\n')
    process.exit(errorCode)
  }
}

process.on('unhandledRejection', (error) =>
  shutdown({
    errorCode: 1,
    reason: 'unhandledRejection',
    error: error instanceof Error ? error : new Error('unhandledRejection with invalid error type'),
  }),
)

process.on('uncaughtException', (error) => shutdown({ errorCode: 1, reason: 'uncaughtException', error }))

process.on('SIGINT', () => shutdown({ errorCode: 0, reason: 'SIGINT' }))

process.on('SIGTERM', async () => shutdown({ errorCode: 0, reason: 'SIGTERM' }))
;(async () => {
  try {
    await app.init()
  } catch (error) {
    if (error instanceof Error) {
      mainLogger.error({ message: 'Error during app init', error })
    }
    process.exit(1)
  }
})()
