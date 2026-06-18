/* eslint-disable dot-notation, jsdoc/check-param-names */
import axios, { AxiosError, AxiosInstance } from 'axios'
import { Logger } from '../../../logger'
import { ConfigValues } from '../services/config'
import { ORKError, InternalServerErrorCode, MissingParamError, ConfigurationError } from '../errors'
import { getLoggerForService } from './logger'
import { AuthorizationInfo, EvaluationResult, Evaluator } from './evaluator'
import { RawAccessConfig } from './accessConfigService'

const MOSYLE_API_VERSION = 'v1'

type Device = {
  useremail: string
  serial_number: string
}

export type MosyleAccessConfig = {
  enforcement: Array<{ area: string; targets?: string[] }>
  maxExpiryHours: number
}

export const mosyleConfigExtractor = (raw: RawAccessConfig): MosyleAccessConfig => ({
  enforcement: raw.mosyleEnforcement,
  maxExpiryHours: raw.maxExpiryHours,
})

export class MosyleService implements Evaluator {
  public readonly logger: Logger
  private readonly mosyleApi: AxiosInstance
  private bearerToken?: { token: string; expiry: Date }
  private mosyleUser: string
  private mosylePass: string
  private readonly mosyleConfig: MosyleAccessConfig

  /**
   * @param options The service configuration object
   * @param options.config Config containing Mosyle access information
   * @param options.mosyleAccessConfig Extracted Mosyle section of the access config
   * @param {AxiosInstance} mosyleApi an Axios instance for the Mosyle API
   */
  constructor(options: { config: ConfigValues; mosyleAccessConfig: MosyleAccessConfig }, mosyleApi?: AxiosInstance) {
    this.logger = getLoggerForService(this, options.config)
    if (!options.config.mosyleAccessToken || !options.config.mosyleUser || !options.config.mosylePass)
      throw new ConfigurationError(['mosyle'])
    this.mosyleApi =
      mosyleApi ||
      axios.create({
        baseURL: 'https://businessapi.mosyle.com',
        headers: {
          accessToken: `${options.config.mosyleAccessToken}`,
        },
      })
    this.logger = getLoggerForService(this, options.config)
    this.bearerToken = undefined
    this.mosyleUser = options.config.mosyleUser
    this.mosylePass = options.config.mosylePass
    this.mosyleConfig = options.mosyleAccessConfig
  }

  implEvaluateAccess =
    () =>
    async (params: {
      username: string
      area?: string
      target?: string
      permission?: string
      context?: Map<string, string>
    }): Promise<EvaluationResult> => {
      if (!params.area) throw new MissingParamError('area')

      const areaMosyleConfig = this.mosyleConfig.enforcement.find((c) => c.area == params.area)
      if (!params.target && (areaMosyleConfig?.targets?.length ?? 0) !== 0) throw new MissingParamError('target')
      if (params.target && !areaMosyleConfig?.targets?.includes(params.target)) return { expiryHours: undefined }
      if (!params.context || !params.context.has('serialNumber')) throw new MissingParamError('serialNumber')
      const verifiedDevice = this.implVerifyUserMachine()
      if (await verifiedDevice({ username: params.username, serialNumber: params.context.get('serialNumber')! }))
        return { expiryHours: this.mosyleConfig.maxExpiryHours }
      else return { expiryHours: 0 }
    }

  implGetAccessesInfo = () => async (): Promise<AuthorizationInfo> => {
    return { allowedPermissionsPerTarget: undefined }
  }

  /**
   * @param params.username user to be authorized
   * @param params.serialNumber the SN from the context
   * @returns Response boolean if SN matches user
   */
  private implVerifyUserMachine =
    () =>
    async (params: { username: string; serialNumber: string }): Promise<boolean> => {
      try {
        const payload = {
          operation: 'list',
          options: {
            os: 'mac',
            supervised: 'true',
            specific_columns: ['device_name', 'device_type', 'serial_number', 'DeviceAttestationStatus', 'useremail'],
          },
        }
        const implLoginToken = this.implGetToken()
        const loginToken = await implLoginToken()
        if (loginToken) {
          this.logger.debug({ message: 'Getting Mosyle device list ...' })
          const { status, data } = await this.mosyleApi.post(`${MOSYLE_API_VERSION}/devices`, payload, {
            headers: { Authorization: `Bearer ${loginToken}` },
          })
          this.logger.debug({ message: `Mosyle devices status: ${status}` })
          const userDevice = data.response[0].devices.find((d: Device) => d.useremail == params.username) as Device
          if (userDevice) return userDevice.serial_number === params.serialNumber
        }
        return false
      } catch (err) {
        if (err instanceof AxiosError) {
          this.logger.error({ message: `Exception during contacting Mosyle: ${err.message}`, error: err })
          throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.AnyInternalConnectionError, {
            description: `Unable to contact Mosyle API: ${err.message}`,
            data: err?.response?.data,
          })
        }
        throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.UnknownError, {
          description: 'Unknown error when contacting Mosyle API',
          data: err,
        })
      }
    }

  private implGetToken = () => async (): Promise<string | undefined> => {
    if (this.bearerToken && this.bearerToken?.expiry > new Date()) return this.bearerToken?.token
    const payload = {
      email: this.mosyleUser,
      password: this.mosylePass,
    }
    this.logger.info({
      message: 'Logging in to Mosyle',
    })
    const { status, headers } = await this.mosyleApi.post(`${MOSYLE_API_VERSION}/login`, payload)
    this.logger.debug({
      message: `Mosyle login status: ${status} (Authorization: ${headers['authorization'] !== undefined})`,
    })
    const token = headers['authorization'].split(' ')[1]
    const expiry = this.getJwtExpiry(token)
    if (expiry) this.bearerToken = { token, expiry }
    else return undefined
    return this.bearerToken.token
  }

  private getJwtExpiry(token: string): Date | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null

      const payload = parts[1]
      const decoded = Buffer.from(payload, 'base64url').toString('utf-8')
      const json = JSON.parse(decoded)

      if (!json.exp) return null

      const bufferSeconds = 15 * 60 // 15 minutes
      const adjustedExpirySeconds = json.exp - bufferSeconds

      return new Date(adjustedExpirySeconds * 1000)
    } catch (error) {
      if (error instanceof Error) this.logger.error({ message: `JWT parsing failed for: ${token}`, error })
      else this.logger.warn({ message: `JWT parsing failed for: ${token}` })
      return null
    }
  }
}
