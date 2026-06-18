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
   * The default API route root
   */
  route: string

  /**
   * Access token for mosyle
   */
  mosyleAccessToken?: string

  /**
   * API user for mosyle
   */
  mosyleUser?: string

  /**
   * API user password for mosyle
   */
  mosylePass?: string
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
    logEntriesToPersist: env.LOG_ENTRIES_TO_PERSIST?.split(',') || ['warn', 'error'],
    mosyleAccessToken: env.MOSYLE_ACCESS_TOKEN,
    mosyleUser: env.MOSYLE_USER,
    mosylePass: env.MOSYLE_PASS,
  }) as ConfigValues

export class ConfigService implements ConfigValues {
  system!: string
  port!: number
  environment!: ConfigValues['environment']
  mosyleAccessToken?: string
  mosyleUser?: string
  mosylePass?: string

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
      envValidator.addDemand('MOSYLE_USER')
    }
    if (!envValidator.isValid()) {
      throw new ConfigurationError(envValidator.getMissingKeys())
    }
  }
  clientApiKey!: string
  route!: string
}
