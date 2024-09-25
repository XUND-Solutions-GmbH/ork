import { SerializeLifecycle } from '../../generic-utils'
import { ConfigValues, getLoggerForService, ORKWeb } from './services'
import { LogLifecycle } from './utils/add-lifecycle-logging'

@LogLifecycle()
@SerializeLifecycle()
export class ORKApplication {
  public readonly logger = getLoggerForService(this, this.config)

  /**
   * @param config The Configuration object
   * @param web The Web Service
   */
  constructor(private readonly config: ConfigValues, private readonly web: ORKWeb) {
    const buf = Buffer.from(
      'CgpTdGFydGluZyBPUksgICAgICAgIC4tIyUlIyMlIz0uICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICArJSo9PSs9KysjJS4gICMtICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgOkA9PT09PT09PT0rJSAtQEA6ICAgICAgICAgIAogICAgICAgICAgICAgICAgOkArKiU9JSs9Kio9PT09KisjKyUjICAgICAgICAgICAKICAgICAgICAgICAgICAgICsjIysjKiolPUAqPSsjPT09PSorPStAKyAgICAgICAgCiAgICAtKiMjIys6ICAqJT0rKiMqJSoqKis9PT09PSsqKiMjPSAgICAgICAgICAgIAogICAgKyMqKioqIyU6ICArQCo9PT09PT09PT09PT09PSMtICAgICAgICAgICAgICAKICAgIEAqKioqKiojIyAgIC4rJSUqKysqIyo9PT09PT0lPSAgICAgICAgICAgICAgCiAgICA9IyoqKioqKiUgICAgICAuLSUjKis9PT09PT0rQDogICAgICAgICAgICAgIAogICAgLSMqKioqKiUtICAgICAgKyMrKisqKysrPT0lJSAgICAgICAgIC0tLTogICAKICAgICAgICArIyoqKiMjICAgICAqIz09Kz09PT09KiVALS4gICAgICAqKiojPSogCiAgICAgICAgLisjKiolOi4gICArJSoqKyoqIyVAQCUjIyUjPSAgIC4rKysjKiotIAogICAgICAgICAgICAuIyMlKisqLiAgLj0jJSVAJSMjIyMjJSMlIyMgOiMlIyojKj0KICAgICAgICAgICAgOisrJT0qK0AjIyMjIyUlQCMjIyMjIyUlIyUlJSMjIyVAOiAgCiAgICAgICAgICAgIC0qKiMjIyUlJSUlJSolIyMjIyMjIyMlJSUlJSUlJSsuICAgIAogICAgICAgICAgICAuLSNAPT09LTogKyUjIyMjIyMjIyMjIyMlKy4gICAgICAgICAKICAgICAgICAgICAgICAgID06ICAgICAjJSMjIyMjIyMjIyMlIysgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgID0jJSMtLS0tLUAjJS0gICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAlIyUqICAgIC1AJSUqICAgICAgICAgICAg',
      'base64',
    )
    this.logger.info({ message: buf.toString('utf-8') })
  }

  /**
   * Initializes the app instance
   */
  public async init() {
    await this.web.init()
  }

  /**
   * Disposes the app instance
   */
  public async dispose() {
    await Promise.all([this.web.dispose()])
  }
}
