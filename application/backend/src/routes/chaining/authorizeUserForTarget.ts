import { EndpointImplementation } from '../../../../rest-server-express'
import { AuthorizeUserForTargetEndpoint } from '../../../../common'
import { AuthorizationController } from '../../controllers'
import getKubernetesUserFromHeader from '../../utils/getKubernetesUserFromHeader'
import { MissingParamError } from '../../errors'

/**
 * Creates an endpoint for listing a permissions a user can get
 * @param authorizationController where to reach the authorization chains
 * @returns {EndpointImplementation<AuthorizeUserForTargetEndpoint>} the created endpoint
 */
export const createAuthorizeUserForTarget =
  (authorizationController: AuthorizationController): EndpointImplementation<AuthorizeUserForTargetEndpoint> =>
  async ({ request, urlParameters }) => {
    try {
      const parsedContext = request.body.context
        ? new Map<string, string>(Object.entries(request.body.context))
        : undefined
      const params = {
        area: urlParameters.area,
        username: getKubernetesUserFromHeader(request.headers['x-vouch-user']),
        target: urlParameters.target,
        permission: request.body.permission,
        context: parsedContext,
      }
      const authorizeUser = authorizationController.implAuthorizeUser()
      const authResult = await authorizeUser(params)
      if (!authResult) {
        return {
          code: 404,
          data: {},
        }
      } else if (authResult.expiryHours === 0) {
        return {
          code: 403,
          data: { data: authResult.message },
        }
      } else {
        return {
          code: 201,
          data: { data: `${authResult.expiryHours}` },
        }
      }
    } catch (error) {
      if (error instanceof MissingParamError) {
        const err = error
        return {
          code: 400,
          data: { result: { status: err.integrationErrorType!.toString(), data: err.details?.description } },
        }
      } else {
        throw error
      }
    }
  }
