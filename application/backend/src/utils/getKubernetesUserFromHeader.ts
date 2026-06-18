import { ORKError, InternalServerErrorCode } from '../errors'
import { AccessConfigService, RawAccessConfig } from '../services/accessConfigService'

type UserHeaderConfig = { userHeaderName: string }

const userHeaderConfigExtractor = (raw: RawAccessConfig): UserHeaderConfig => ({
  userHeaderName: raw.userHeaderName,
})

const { userHeaderName } = AccessConfigService.extract(userHeaderConfigExtractor)

/**
 * A function to read username from vouch header
 * @param {Request} request The request with the vouch header
 * @throws {ORKError} Thrown when the user header is not an email address
 * @returns {string} email address of user
 */
export function getKuebernetesUserFromHeader(request: Request): string {
  const user = request.headers.get(userHeaderName)
  return getKubernetesUserFromHeaderValue(user)
}

/**
 * A function to format a user header for kubernetes api
 * @param {string | string[]} userHeader The user header from the request
 * @throws {ORKError} Thrown when the user header is not a string
 * @throws {ORKError} Thrown when the user header is not a email address
 * @returns {string} A single username for kubernetes
 */
export function getKubernetesUserFromHeaderValue(user: string | string[] | null): string {
  if (!user || Array.isArray(user) || user.includes(',')) {
    throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.AnyInternalConnectionError, {
      description: `Auth proxy header format mismatch`,
    })
  }
  if (!user.includes('@') || !user.includes('.')) {
    throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.AnyInternalConnectionError, {
      description: `Cannot get email address from user header [${user}]`,
    })
  }

  return user
}
