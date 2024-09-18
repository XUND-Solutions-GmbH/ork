import { Server } from 'net'
import axios from 'axios'
import { ConfigService } from './config'
import { ORKWeb } from './web'

describe('ORK module', () => {
  /**
   * @returns A Web service
   */
  const createTestWeb = () => {
    const config = new ConfigService({
      environment: 'TEST',
      port: Math.round(Math.random() * 9999) + 10000,
    })

    return new ORKWeb({ config })
  }

  it('Should handle server status updates', async () => {
    const srv = createTestWeb()
    await srv.init()
    expect(srv.server?.listening).toBe(true)
    await srv.dispose()
    expect(srv.server?.listening).toBe(false)
  })

  it('Should kill opened connections on dispose and start a new instance', async () => {
    const srv = createTestWeb()
    srv.expressApp.get('/longRequest', (_req, resp) => {
      setTimeout(() => resp.end('Ok'), 100 * 10000)
    })
    await srv.init()
    const disposePromise = srv.dispose()
    axios(`http://localhost:${srv.options.config.port}/longRequest`).catch(() => {
      /** ignore, it should throw */
    })
    await disposePromise
    const srv2 = createTestWeb()
    srv2.expressApp.get('/test', (_req, resp) => resp.end('Yep'))
    await srv2.init()
    const validResponse = await axios(`http://localhost:${srv2.options.config.port}/test`)
    expect(validResponse.data).toBe('Yep')
    await srv2.dispose()
  })

  it('Init should reject if failed to init the server', async () => {
    const mockSrv = createTestWeb() // To hold the port
    await mockSrv.init()
    const srv = createTestWeb()
    ;(srv.expressApp.listen as unknown) = (_port: number, cb: (err?: Error) => void) => cb(new Error(':('))
    await expect(() => srv.init()).rejects.toThrowError()
    await mockSrv.dispose()
    await srv.dispose()
  })

  it('Dispose should reject if failed to close the server', async () => {
    const srv = createTestWeb()
    await srv.init()
    if (!srv.server) {
      expect(srv.server).toBeInstanceOf(Server)
    } else {
      const oldServerClose = srv.server.close
      ;(srv.server.close as unknown) = (cb: (err?: Error) => void) => {
        cb(new Error(':('))
        return srv.server
      }
      await expect(() => srv.dispose()).rejects.toThrow()
      srv.server.close = oldServerClose
      await srv.dispose()
    }
  })
})
