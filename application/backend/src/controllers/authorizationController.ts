/* eslint-disable jsdoc/check-param-names */
import { Logger } from '../../../logger'
import { AuthorizationResult } from '../../../common'
import { Authorizer } from '../services/authorizer'
import { Evaluator, AuthorizationInfo } from '../services/evaluator'
import { getLoggerForService } from '../services/logger'
import { ConfigValues } from '../services/config'
import { ORKError } from '../errors'

/**
 * A list of evaluators to check before calling authorizer
 * @typedef {AuthorizationChain}
 */
type AuthorizationChain = {
  authorizer: Authorizer
  evaluators: Evaluator[]
}

/**
 * Controller to map a route to an authorization chain
 * @class AuthorizationController
 * @typedef {AuthorizationController}
 */
export class AuthorizationController {
  private authorizationChains = new Map<string, AuthorizationChain>()
  public readonly logger: Logger

  /**
   * @param options The service configuration object
   * @param {ConfigValues} options.config The application config
   */
  constructor(options: { config: ConfigValues }) {
    this.logger = getLoggerForService(this, options.config)
  }
  /**
   * A chain to register
   * @public
   * @param {string} name area of the chain
   * @param {Authorizer} authorizer authorizer to allow area
   * @param {Evaluator[]} evaluators evaluators checking access to area
   */
  public addChain(name: string, authorizer: Authorizer, evaluators: Evaluator[]) {
    this.logger.info({ message: `Adding chain for ${name}` })
    const chain: AuthorizationChain = {
      authorizer,
      evaluators,
    }
    this.authorizationChains.set(name, chain)
  }

  /**
   * Evaluate chain and return authorization result
   * @public
   * @param {string} params.area area to be accessed
   * @param {string} params.username user accessing area
   * @param {?string} [params.target] identifier within area being accessed
   * @param {?string} [params.permission] permissions on target being requested
   * @param {Map<string, string>} [params.context] additional context information provided by the client
   * @returns {(AuthorizationResult | undefined)} undefined if cannot be interpreted, else result of authorization attempt
   */
  implAuthorizeUser =
    () =>
    async (params: {
      area: string
      username: string
      target?: string
      permission?: string
      context?: Map<string, string>
    }): Promise<AuthorizationResult | undefined> => {
      this.logger.debug({
        message: `Received authorization request for area ${params.area} target ${params.target} and permission ${params.permission}`,
      })
      const chain = this.authorizationChains.get(params.area)
      if (!chain || !chain?.evaluators || !chain?.authorizer) return undefined

      let minExpiry = undefined
      let minEvaluator = ''
      for (const e of chain.evaluators) {
        try {
          const evaluateAccess = e.implEvaluateAccess()
          const expiry = (
            await evaluateAccess({
              username: params.username,
              area: params.area,
              target: params.target,
              permission: params.permission,
              context: params.context,
            })
          ).expiryHours
          this.logger.debug({ message: `Result of evaluator: ${expiry}` })
          if (expiry === undefined) continue
          if (expiry === 0) {
            minExpiry = 0
            minEvaluator = e.constructor.name
            break
          }
          if (!minExpiry) minExpiry = expiry
          if (expiry < minExpiry) minExpiry = expiry
        } catch (error) {
          if (error instanceof ORKError)
            this.logger.warn({
              message: `Exception in evaluator ${e.constructor.name}: ${error.message}:${error.details?.description}`,
            })
          throw error
        }
      }
      this.logger.debug({ message: `Expiry based on minimal result: ${minExpiry}` })
      if (minExpiry === 0) return { expiryHours: 0, message: minEvaluator }
      const authorize = chain.authorizer.implAuthorize()
      const authorizationResult = await authorize({
        username: params.username,
        area: params.area,
        target: params.target,
        permission: params.permission,
        expiry: minExpiry,
      })
      this.logger.debug({ message: `Result of authorize: ${JSON.stringify(authorizationResult)}` })
      if (!authorizationResult) {
        return undefined
      } else if (authorizationResult?.expiryHours <= 0) {
        return { expiryHours: 0, message: params.area }
      } else {
        return { expiryHours: authorizationResult.expiryHours, message: authorizationResult.message }
      }
    }

  /**
   * Evaluate chain and return authorization result
   * @public
   * @param {string} params.area area to be accessed
   * @param {string} params.username user accessing area
   * @returns {(AuthorizationInfo | undefined)} undefined if the permssion is not defined for user
   */
  implGetChainInfo =
    () =>
    async (params: { area: string; username: string; target?: string }): Promise<AuthorizationInfo | undefined> => {
      this.logger.debug({
        message: `Received chain info request for area ${params.area} target ${params.target}`,
      })
      const chain = this.authorizationChains.get(params.area)
      if (!chain || !chain?.evaluators) return undefined

      const authorizationInfos: AuthorizationInfo[] = []
      for (const e of chain.evaluators) {
        const getAccessInfo = e.implGetAccessesInfo()
        const accessInfoResult = await getAccessInfo({
          username: params.username,
          target: params.target,
        })
        this.logger.debug({ message: `Result of evaluator: ${JSON.stringify(accessInfoResult)}` })
        authorizationInfos.push(accessInfoResult)
      }
      return this.reduceAuthorizationInfos(authorizationInfos)
    }

  /**
   * Combine AuthorizationInfos based on common set
   * @private
   * @param {AuthorizationInfo[]} authorizationInfos to be combined
   * @returns {(AuthorizationInfo | undefined)} combination of input or undefined if no info available
   */
  private reduceAuthorizationInfos(authorizationInfos: AuthorizationInfo[]): AuthorizationInfo | undefined {
    this.logger.debug({ message: `Reducing ${authorizationInfos.length} authorization infos` })
    if (authorizationInfos.length === 0) return undefined
    const combinedAuthorizationInfo: AuthorizationInfo = { allowedPermissionsPerTarget: undefined }
    let i = 0
    while (combinedAuthorizationInfo.allowedPermissionsPerTarget === undefined && i < authorizationInfos.length) {
      const referenceAuthInfo = authorizationInfos[i]
      if (referenceAuthInfo.allowedPermissionsPerTarget !== undefined) {
        combinedAuthorizationInfo.allowedPermissionsPerTarget = []
        for (const { target, permissions } of referenceAuthInfo.allowedPermissionsPerTarget) {
          const collectedTargetPermissions = authorizationInfos.map(
            (authInfo) => authInfo.allowedPermissionsPerTarget?.find((tp) => tp.target === target)?.permissions,
          )
          if (permissions !== undefined) {
            combinedAuthorizationInfo.allowedPermissionsPerTarget.push({
              target,
              permissions: permissions?.filter((p) =>
                collectedTargetPermissions.every(
                  (targetPermissions) => targetPermissions === undefined || targetPermissions.includes(p),
                ),
              ),
            })
          } else {
            const referencePermissionsForTarget = collectedTargetPermissions.find((ps) => ps !== undefined)
            combinedAuthorizationInfo.allowedPermissionsPerTarget.push({
              target,
              permissions: referencePermissionsForTarget?.filter((p) =>
                collectedTargetPermissions.every(
                  (targetPermissions) => targetPermissions === undefined || targetPermissions.includes(p),
                ),
              ),
            })
          }
        }
      }
      i++
    }
    return combinedAuthorizationInfo
  }
}
