import { EndpointImplementation } from '../../../../rest-server-express'
import { GetAccessInfoForUserEndpoint, TargetPermissionsForUserResponse } from '../../../../common'
import { AuthorizationController } from '../../controllers'
import getKubernetesUserFromHeader from '../../utils/getKubernetesUserFromHeader'

/**
 * Description placeholder
 * @param {AuthorizationController} authorizationController that holds the chains
 * @returns {EndpointImplementation<GetAccessInfoForUserEndpoint>} implementation to be added
 */
export const createGetAccessInfoForUsers =
  (authorizationController: AuthorizationController): EndpointImplementation<GetAccessInfoForUserEndpoint> =>
  async ({ request, urlParameters }) => {
    const { area, target } = urlParameters
    const username = getKubernetesUserFromHeader(request.headers['x-vouch-user'])

    const getAuthorizationInfo = authorizationController.implGetChainInfo()
    const allowedAuthorizations = await getAuthorizationInfo({ area, username, target })
    if (!allowedAuthorizations) {
      return {
        code: 404,
        data: {},
      }
    }
    if (!allowedAuthorizations.allowedPermissionsPerTarget) {
      return {
        code: 200,
        data: { permissions: { area } as TargetPermissionsForUserResponse },
      }
    }

    const responseData: TargetPermissionsForUserResponse = {
      area,
      target: target ? [target] : allowedAuthorizations.allowedPermissionsPerTarget.map((ai) => ai.target),
      permissions: allowedAuthorizations.allowedPermissionsPerTarget
        .filter((ai) => ai.permissions !== undefined)
        .map((ai) => ai.permissions)
        .flat() as string[],
    }
    return {
      code: 200,
      data: {
        permissions: responseData,
      },
    }
  }
