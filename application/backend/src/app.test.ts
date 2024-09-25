import { ORKApplication } from './app'
import { ORKWeb, ConfigService } from './services'

describe('App', () => {
  it('Should be created and disposed', async () => {
    const config = new ConfigService({
      environment: 'TEST',
      port: Math.round(Math.random() * 9999) + 10000,
    })
    const web = new ORKWeb({ config })
    const app = new ORKApplication(config, web)
    await app.init()
    await app.dispose()
  })
})
