/* eslint-disable require-jsdoc */
import Semaphore from 'semaphore-async-await'
import { DisposableService } from './disposable-service'

export const serializeLifecycle = (service: DisposableService) => {
  const lock = new Semaphore(1)
  const oldInit = service.init.bind(service)
  const oldDispose = service.dispose.bind(service)
  service.init = async () => {
    await lock.acquire()
    try {
      await oldInit()
    } finally {
      lock.release()
    }
  }

  service.dispose = async () => {
    await lock.acquire()
    try {
      await oldDispose()
    } finally {
      lock.release()
    }
  }
}

/**
 * Class decorator that serializes the init() and dispose() lifecycle of a disposable service
 * @returns the decorated class
 */
export const SerializeLifecycle =
  () =>
  <T extends { new (...args: any[]): DisposableService }>(ctor: T) =>
    class extends ctor {
      constructor(...args: any[]) {
        super(...args)
        serializeLifecycle(this)
      }
    }
