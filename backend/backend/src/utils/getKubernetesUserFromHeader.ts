import { ORKError, InternalServerErrorCode } from '../errors'

/**
 * A function to format a user header for kubernetes api
 * @param {string | string[]} userHeader The user header from the request
 * @throws {ORKError} Thrown when the user header is not a string
 * @throws {ORKError} Thrown when the user header is not a email address
 * @returns {string} A single username for kubernetes
 */
export default function getKubernetesUserFromHeader(userHeader?: string | string[]): string {
  if (Array.isArray(userHeader)) {
    throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.AnyInternalConnectionError, {
      description: `user header format mismatch`,
    })
  }
  const kubernetesUser = userHeader && userHeader.includes('@') ? userHeader : undefined
  if (!kubernetesUser) {
    throw new ORKError('INTERNAL_SERVER_ERROR', undefined, InternalServerErrorCode.AnyInternalConnectionError, {
      description: `Cannot get email address from user header [${userHeader}]`,
    })
  }
  return kubernetesUser
}
