import { getDummyLogger } from '../../../logger'
import { DisposableService } from '../../../generic-utils'
import { addLifecycleLogging, LogLifecycle } from './add-lifecycle-logging'

describe('Add Lifecycle Logging', () => {
  it('Should trace init & dispose start and success', async () => {
    const logger = getDummyLogger('')
    class MockDisposableService implements DisposableService {
      init = () => Promise.resolve()
      dispose = () => Promise.resolve()
      logger = logger
    }
    const instance = new MockDisposableService()
    const debugSpy = jest.spyOn(logger, 'debug')

    addLifecycleLogging(instance)
    const initializing = instance.init()
    expect(debugSpy).toBeCalledWith({ message: 'Initializing...' })
    await initializing

    expect(debugSpy).toBeCalled()

    const disposing = instance.dispose()
    expect(debugSpy).toBeCalledWith({ message: 'Disposing...' })
    await disposing
    expect(debugSpy).toBeCalled()
  })

  it('Should log errors on init & dispose failure', async () => {
    const error = new Error(':(')
    const logger = getDummyLogger('')
    class MockDisposableService implements DisposableService {
      init = () => Promise.reject(error)
      dispose = () => Promise.reject(error)
      logger = logger
    }
    const instance = new MockDisposableService()
    const errorSpy = jest.spyOn(logger, 'error')
    addLifecycleLogging(instance)
    try {
      await instance.init()
    } catch {
      // ignore
    }

    expect(errorSpy).toBeCalledWith({
      message: 'Failed to initialize',
      error,
    })

    try {
      await instance.dispose()
    } catch {
      // ignore
    }

    expect(errorSpy).toBeCalledWith({ message: 'Failed to dispose', error })
  })
})

describe('@LogLifecycle() decorator', () => {
  it('Should add a logger with a correct scope', async () => {
    const decorated = LogLifecycle()(
      class MockDisposableService implements DisposableService {
        init = () => Promise.resolve()
        dispose = () => Promise.resolve()
        logger = getDummyLogger('')
      },
    )
    const instance = new decorated()
    await instance.init()
  })
})
