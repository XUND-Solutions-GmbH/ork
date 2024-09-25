import { EndpointImplementation } from '../../../../rest-server-express'
import { GetUserRolebindingsEndpoint, PermissionsForUserResponse } from '../../../../common'
import { RolebindingConfigService } from '../../services'
import getKubernetesUserFromHeader from '../../utils/getKubernetesUserFromHeader'

/**
 * Creates and endpoint for listing roles from config
 * @returns {EndpointImplementation<GetUserRolebindingsEndpoint>} the created endpoint
 */
export const createGetUserRolebindingsRoute =
  (): EndpointImplementation<GetUserRolebindingsEndpoint> =>
  async ({ request }) => {
    const rolebindingConfigService = new RolebindingConfigService()
    const permissionsPerCluster = rolebindingConfigService.getPermissionsForUser(
      getKubernetesUserFromHeader(request.headers['x-vouch-user']),
    )

    const clusterPermissionsResponse: PermissionsForUserResponse[] = []
    if (permissionsPerCluster === undefined)
      return {
        code: 404,
        data: { result: { rolebindings: clusterPermissionsResponse } },
      }

    for (const c of permissionsPerCluster.keys()) {
      const permissions: PermissionsForUserResponse = {
        cluster: c,
        roles: permissionsPerCluster.get(c)?.roles,
        clusterRoles: permissionsPerCluster.get(c)?.clusterRoles,
      }
      clusterPermissionsResponse.push(permissions)
    }

    return {
      code: 200,
      data: { result: { rolebindings: clusterPermissionsResponse } },
    }
  }
