import { EndpointImplementation } from '../../../../rest-server-express'
import { AddRolebindingToClusterEndpoint } from '../../../../common'
import { KubernetesService } from '../../services'
import getKubernetesUserFromHeader from '../../utils/getKubernetesUserFromHeader'

/**
 * Creates and endpoint to add a rolebinding to the cluster via KubeAPI
 * @param {KubernetesService} kubernetesService a service instance to use the KubeAPI
 * @returns {EndpointImplementation<AddRolebindingToClusterEndpoint>} the created endpoint
 */
export const createAddRolebindingToClusterRoute =
  (kubernetesService: KubernetesService): EndpointImplementation<AddRolebindingToClusterEndpoint> =>
  async ({ request, urlParameters }) => {
    urlParameters.id = request.params.id
    const addRolebindingToCluster = kubernetesService.implAddRolebindingToCluster()
    const params = {
      cluster: request.params.id,
      username: getKubernetesUserFromHeader(request.headers['x-vouch-user']),
      role: request.body.role,
    }
    const status = await addRolebindingToCluster(params)
    return status
  }
