import { Options } from 'sequelize'
import dotenv from 'dotenv'
import { EnvironmentValidator } from '../../../service-utils'
import { ConfigurationError } from '../errors'

export interface ConfigValues {
  /**
   * The System name (e.g. 'ORK')
   */
  system: string
  /**
   * The Environment definition
   */
  environment: 'LOCAL_DEVELOPMENT' | 'TEST' | 'DEV' | 'DEMO' | 'PRODUCTION'

  /**
   * The application port to listen
   */
  port: number

  /**
   * The default admin API route root
   */
  route: string

  /**
   * The cookie name that contains the session ID
   * Should be different than the Business Admin cookie name
   */
  sessionIdCookieName: string
}

const defaultApplicationPort = 8080

/**
 * @param env The Environment object (falls back to process.env)
 * @returns The generated Config values
 */
export const getDefaultConfigValues = (env = process.env) =>
  ({
    system: env.SYSTEM || 'ORK',
    environment: (env.ENVIRONMENT as ConfigValues['environment']) || 'LOCAL_DEVELOPMENT',
    port: parseInt(env.OWN_PORT as string, 10) || defaultApplicationPort,
    route: '/api/v1',
    slackBackendChannelWebhookUrl: env.SLACK_BACKEND_WEBHOOK_URL,
    logEntriesToPersist: env.LOG_ENTRIES_TO_PERSIST?.split(',') || ['warn', 'error'],
    sessionIdCookieName: env.SESSION_ID_NAME || 'xsid',
    foxpassApiKey: env.FOXPASS_API_KEY,
  } as ConfigValues)

export class ConfigService implements ConfigValues {
  system!: string
  port!: number
  environment!: ConfigValues['environment']
  additionalDbSettings?: Options

  /**
   * @param values The initial values
   * @param env The environment object, defaults to process.env
   */
  constructor(values?: Partial<ConfigValues>, env = process.env) {
    dotenv.config()
    Object.assign(this, getDefaultConfigValues(env), values)

    const envValidator = new EnvironmentValidator(env, [])
    if (this.environment !== 'LOCAL_DEVELOPMENT' && this.environment !== 'TEST') {
      //Required env variable checks should be here
      envValidator.addDemand('MYSQL_DATABASE_USERNAME')
      envValidator.addDemand('MYSQL_DATABASE_PASSWORD')
    }
    if (!envValidator.isValid()) {
      throw new ConfigurationError(envValidator.getMissingKeys())
    }
  }
  sessionIdCookieName!: string
  clientApiKey!: string
  route!: string
}
